/**
 * GET /api/test-claude
 * 
 * Test endpoint to verify Anthropic API is working correctly
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      status: "error",
      message: "No ANTHROPIC_API_KEY found in environment",
      apiKeyPresent: false,
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    // Simple test call
    const testMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Say 'API test successful' and nothing else.",
        },
      ],
    });

    const textBlock = testMessage.content.find((block) => block.type === "text");
    const response = textBlock?.type === "text" ? textBlock.text : "No text response";

    return NextResponse.json({
      status: "success",
      message: "Anthropic API is working!",
      apiKeyPresent: true,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      testResponse: response,
      model: "claude-sonnet-4-20250514",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Anthropic API test failed",
      apiKeyPresent: true,
      apiKeyPrefix: apiKey.substring(0, 10) + "...",
      error: error.message,
      errorStatus: error.status,
      errorType: error.type,
    });
  }
}
