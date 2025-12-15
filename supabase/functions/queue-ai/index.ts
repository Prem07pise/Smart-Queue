import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, queueData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'predict_wait_time') {
      systemPrompt = `You are a queue management AI assistant. Based on the queue data provided, predict wait times and provide insights. Be concise and helpful. Always respond in JSON format with the following structure:
{
  "predictedWaitMinutes": number,
  "confidence": "high" | "medium" | "low",
  "factors": ["factor1", "factor2"],
  "recommendation": "string"
}`;
      userPrompt = `Based on this queue data, predict the wait time for a new customer joining now:
- Current queue size: ${queueData.queueSize}
- Average service time: ${queueData.avgServiceTime} minutes
- People served today: ${queueData.servedToday}
- Current time: ${new Date().toLocaleTimeString()}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

Provide a wait time prediction with confidence level and factors.`;
    } else if (type === 'optimize_queue') {
      systemPrompt = `You are a queue optimization AI. Analyze queue patterns and suggest improvements. Be actionable and specific. Always respond in JSON format:
{
  "suggestions": [{"title": "string", "description": "string", "impact": "high" | "medium" | "low"}],
  "peakHours": ["hour1", "hour2"],
  "staffingRecommendation": "string"
}`;
      userPrompt = `Analyze this queue data and provide optimization suggestions:
- Total waiting: ${queueData.totalWaiting}
- People served today: ${queueData.servedToday}
- Average service time: ${queueData.avgServiceTime} minutes
- Current hour: ${new Date().getHours()}:00

Provide actionable suggestions to improve queue efficiency.`;
    } else if (type === 'customer_insights') {
      systemPrompt = `You are a helpful queue assistant. Provide friendly, encouraging messages to customers waiting in queue. Keep responses brief and positive. Respond in JSON:
{
  "message": "string",
  "tip": "string",
  "funFact": "string"
}`;
      userPrompt = `A customer is at position ${queueData.position} with an estimated wait of ${queueData.estimatedWait} minutes. Provide an encouraging message, a waiting tip, and a fun fact to pass the time.`;
    }

    console.log(`Processing ${type} request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response received:", content?.substring(0, 100));

    // Try to parse as JSON, fallback to raw content
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch {
      parsedContent = { rawResponse: content };
    }

    return new Response(JSON.stringify({ result: parsedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in queue-ai function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
