const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || process.env.VITE_FITBIT_CLIENT_ID || "fitbit_client_id";
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || "fitbit_client_secret";
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || "http://localhost:5000/auth/fitbit/callback";

export interface FitbitAuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: number;
}

export interface FitbitBiometricData {
  heartRate: number;
  hrv?: number;
  activityLevel: string;
  restingHeartRate?: number;
  steps?: number;
  timestamp: number;
}

export class FitbitService {
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: FITBIT_CLIENT_ID,
      redirect_uri: FITBIT_REDIRECT_URI,
      scope: 'heartrate activity profile',
      state: state
    });

    return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<FitbitAuthTokens> {
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        client_id: FITBIT_CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: FITBIT_REDIRECT_URI,
        code: code
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user_id,
      expiresIn: data.expires_in
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<FitbitAuthTokens> {
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user_id,
      expiresIn: data.expires_in
    };
  }

  async getCurrentBiometricData(accessToken: string): Promise<FitbitBiometricData> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get heart rate data
      const heartRateResponse = await fetch(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d/1min.json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!heartRateResponse.ok) {
        throw new Error(`Failed to fetch heart rate data: ${heartRateResponse.statusText}`);
      }

      const heartRateData = await heartRateResponse.json();
      
      // Get the most recent heart rate reading
      const recentHeartRate = heartRateData['activities-heart-intraday']?.dataset?.slice(-1)[0];
      const restingHeartRate = heartRateData['activities-heart'][0]?.value?.restingHeartRate;

      // Get activity data
      const activityResponse = await fetch(
        `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      let activityData = {};
      if (activityResponse.ok) {
        activityData = await activityResponse.json();
      }

      return {
        heartRate: recentHeartRate?.value || restingHeartRate || 70,
        restingHeartRate,
        steps: activityData.summary?.steps || 0,
        activityLevel: this.calculateActivityLevel(activityData.summary?.veryActiveMinutes || 0),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching Fitbit data:', error);
      throw new Error(`Failed to fetch biometric data: ${error.message}`);
    }
  }

  private calculateActivityLevel(veryActiveMinutes: number): string {
    if (veryActiveMinutes >= 30) return 'High';
    if (veryActiveMinutes >= 15) return 'Moderate';
    return 'Low';
  }

  async getHeartRateVariability(accessToken: string): Promise<number | undefined> {
    // HRV data is not directly available through Fitbit Web API
    // This would require Fitbit Premium or specialized devices
    // For now, we'll estimate based on heart rate patterns
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const response = await fetch(
        `https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d/1min.json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) return undefined;

      const data = await response.json();
      const dataset = data['activities-heart-intraday']?.dataset || [];
      
      if (dataset.length < 10) return undefined;

      // Calculate a simple HRV estimate based on heart rate variability
      const recentReadings = dataset.slice(-10);
      const intervals = [];
      
      for (let i = 1; i < recentReadings.length; i++) {
        intervals.push(Math.abs(recentReadings[i].value - recentReadings[i-1].value));
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      return Math.min(avgInterval * 10, 100); // Normalize to reasonable HRV range
    } catch (error) {
      console.error('Error calculating HRV:', error);
      return undefined;
    }
  }
}

export const fitbitService = new FitbitService();
