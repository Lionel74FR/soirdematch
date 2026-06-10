import { createHash } from "crypto";

const META_API_VERSION = "v21.0";

type MetaUserData = {
  email?: string;
  phone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
};

type MetaEvent = {
  eventName: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: string;
  userData: MetaUserData;
  customData?: Record<string, unknown>;
};

function hash(value: string): string {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

/**
 * Sends a server-side event to the Meta Conversions API.
 * Requires META_PIXEL_ID and META_CAPI_TOKEN environment variables.
 */
export async function sendMetaEvent(event: MetaEvent): Promise<unknown> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;

  if (!pixelId || !token) {
    throw new Error(
      "META_PIXEL_ID and META_CAPI_TOKEN environment variables are not set",
    );
  }

  const userData: Record<string, unknown> = {};
  if (event.userData.email) userData.em = hash(event.userData.email);
  if (event.userData.phone) userData.ph = hash(event.userData.phone);
  if (event.userData.clientIpAddress)
    userData.client_ip_address = event.userData.clientIpAddress;
  if (event.userData.clientUserAgent)
    userData.client_user_agent = event.userData.clientUserAgent;
  if (event.userData.fbc) userData.fbc = event.userData.fbc;
  if (event.userData.fbp) userData.fbp = event.userData.fbp;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource ?? "website",
        user_data: userData,
        custom_data: event.customData,
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meta CAPI request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
