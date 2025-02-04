import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUBREDDITS = [
  'vancouverlandlords',
  'landlordbc',
  'legaladvicecanada'
];

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting Reddit data collection...');

    // Get Reddit OAuth credentials from environment variables
    const clientId = Deno.env.get('REDDIT_CLIENT_ID');
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Reddit credentials not configured');
    }

    // Get access token
    console.log('Obtaining Reddit access token...');
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${tokenResponse.status}`);
    }

    const tokenData: RedditTokenResponse = await tokenResponse.json();
    console.log('Successfully obtained access token');

    for (const subreddit of SUBREDDITS) {
      console.log(`Fetching posts from r/${subreddit}...`);
      
      // Fetch posts using OAuth
      const response = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/hot?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'User-Agent': 'RentalBot/1.0 (by /u/your_reddit_username)',
          }
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch from r/${subreddit}:`, response.status);
        continue;
      }

      const data = await response.json();
      const posts = data.data.children;

      for (const post of posts) {
        const postData = post.data;
        
        // Skip if it's not a text post
        if (!postData.is_self || !postData.selftext) continue;

        // Process the post content
        const content = `Title: ${postData.title}\n\nContent: ${postData.selftext}`;
        
        // Create chunks from the content (simplified for now)
        const chunks = [{
          text: content,
          metadata: {
            url: `https://reddit.com${postData.permalink}`,
            title: postData.title,
            subreddit: postData.subreddit,
            created_utc: postData.created_utc
          }
        }];

        // Store in database
        const { error: upsertError } = await supabase
          .from('knowledge_web')
          .upsert({
            url: `https://reddit.com${postData.permalink}`,
            source_type: 'reddit',
            subreddit: postData.subreddit,
            title: postData.title,
            content: content,
            post_date: new Date(postData.created_utc * 1000).toISOString(),
            chunks: chunks,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'url'
          });

        if (upsertError) {
          console.error('Error storing post:', upsertError);
          continue;
        }
      }
      
      // Wait between subreddits to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return new Response(
      JSON.stringify({ 
        message: 'Reddit data collection completed successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in fetch-reddit-posts function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Reddit posts',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});