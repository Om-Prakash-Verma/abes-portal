package com.abes.portal;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;
import android.webkit.CookieManager;

import androidx.core.app.NotificationCompat;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class SessionKeeperService extends Service {

    private static final String TAG = "SessionKeeperService";
    public static final String ACTION_START = "com.abes.portal.ACTION_START";
    public static final String ACTION_STOP = "com.abes.portal.ACTION_STOP";
    public static final String ACTION_PING = "com.abes.portal.ACTION_PING";
    public static final String ACTION_ALARM_PING = "com.abes.portal.ACTION_ALARM_PING";

    public static final String PREFS_NAME = "abes_session_prefs";
    public static final String KEY_COOKIE = "cookie";
    public static final String KEY_LAST_PING = "last_ping_timestamp";
    public static final String KEY_IS_RUNNING = "is_running";
    public static final String KEY_SESSION_EXPIRED = "session_expired";

    private static final String CHANNEL_ID = "abes_erp_session_channel";
    private static final int NOTIFICATION_ID = 2024;
    private static final int ALARM_REQUEST_CODE = 9988;

    // Real authenticated student dashboard endpoint on ABES ERP
    private static final String ERP_URL = "https://erp.abes.ac.in/Home/Student/Default.aspx";
    private static final long PING_INTERVAL_MS = 10 * 60 * 1000L; // 10 minutes (server expires at 20 min)

    private ScheduledExecutorService scheduler;
    private NotificationManager notificationManager;

    @Override
    public void onCreate() {
        super.onCreate();
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP.equals(action)) {
            stopSessionKeeper();
            return START_NOT_STICKY;
        }

        // Handle updated cookie if passed in extras
        if (intent != null && intent.hasExtra(KEY_COOKIE)) {
            String newCookie = intent.getStringExtra(KEY_COOKIE);
            if (newCookie != null && !newCookie.trim().isEmpty()) {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                prefs.edit().putString(KEY_COOKIE, newCookie.trim()).apply();
            }
        }

        startInForeground();

        if (ACTION_ALARM_PING.equals(action)) {
            // Fired by AlarmManager while device was idle/Doze
            triggerSinglePing();
            scheduleNextAlarm();
        } else if (ACTION_PING.equals(action)) {
            // Immediate one-off ping requested by app
            triggerSinglePing();
            scheduleNextAlarm();
        } else {
            // ACTION_START: initial launch, run now and start both Alarm and Scheduler
            triggerSinglePing();
            startScheduledPings();
            scheduleNextAlarm();
        }

        return START_STICKY;
    }

    private void startInForeground() {
        Notification notification = buildNotification("Keeping college ERP session active in background");
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_IS_RUNNING, true).apply();
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground service", e);
        }
    }

    private synchronized void startScheduledPings() {
        if (scheduler != null && !scheduler.isShutdown()) {
            return;
        }
        scheduler = Executors.newSingleThreadScheduledExecutor();
        // Schedule periodic in-memory check every 10 min
        scheduler.scheduleWithFixedDelay(this::pingServer, 10, 10, TimeUnit.MINUTES);
    }

    private void scheduleNextAlarm() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(this, SessionKeeperService.class);
        intent.setAction(ACTION_ALARM_PING);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getService(this, ALARM_REQUEST_CODE, intent, flags);
        long triggerAtMillis = SystemClock.elapsedRealtime() + PING_INTERVAL_MS;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            }
            Log.d(TAG, "Alarm scheduled for next keep-alive in 10 minutes");
        } catch (SecurityException se) {
            Log.w(TAG, "Exact alarm permission restricted, falling back to inexact alarm", se);
            try {
                alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAtMillis, pendingIntent);
            } catch (Exception ignored) {}
        }
    }

    private void cancelAlarm() {
        try {
            AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(this, SessionKeeperService.class);
            intent.setAction(ACTION_ALARM_PING);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getService(this, ALARM_REQUEST_CODE, intent, flags);
            alarmManager.cancel(pendingIntent);
        } catch (Exception ignored) {}
    }

    private void triggerSinglePing() {
        Executors.newSingleThreadExecutor().execute(this::pingServer);
    }

    private void pingServer() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ABESPortal:SessionKeeperWakeLock");
            wakeLock.acquire(45000); // 45-sec timeout
        }

        try {
            String cookie = getActiveCookie();
            if (cookie == null || cookie.isEmpty()) {
                Log.w(TAG, "No active ERP cookie available to ping");
                return;
            }

            URL url = new URL(ERP_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(20000);
            conn.setInstanceFollowRedirects(false); // Detect 302 redirects directly
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36");
            conn.setRequestProperty("Referer", "https://erp.abes.ac.in/Home/Student/Default.aspx");
            conn.setRequestProperty("Cookie", cookie);

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Heartbeat request to " + ERP_URL + " responded with code: " + responseCode);

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            if (responseCode == 200) {
                // Read sample body to confirm it's not a redirected login page
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append('\n');
                    if (sb.length() > 3000) break;
                }
                reader.close();

                String preview = sb.toString();
                boolean isLoginForm = preview.contains("Login.aspx") || preview.contains("Login Form") || preview.contains("txtuser");

                if (!isLoginForm) {
                    // GENUINE ACTIVE SESSION!
                    long now = System.currentTimeMillis();
                    prefs.edit()
                            .putLong(KEY_LAST_PING, now)
                            .putBoolean(KEY_SESSION_EXPIRED, false)
                            .apply();

                    // CRITICAL: Capture and persist sliding renewed cookies!
                    parseAndPersistCookies(conn.getHeaderFields().get("Set-Cookie"), cookie);

                    SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                    String timeStr = sdf.format(new Date(now));
                    updateNotification("ERP Session active • Last synced at " + timeStr);
                } else {
                    Log.w(TAG, "Heartbeat returned 200 but content is Login Form. Session expired.");
                    handleSessionExpired(prefs);
                }
            } else if (responseCode == 302) {
                String location = conn.getHeaderField("Location");
                Log.w(TAG, "Heartbeat received 302 redirect to: " + location + ". Session expired on server.");
                handleSessionExpired(prefs);
            }

            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Heartbeat request failed", e);
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }

    private void handleSessionExpired(SharedPreferences prefs) {
        prefs.edit().putBoolean(KEY_SESSION_EXPIRED, true).apply();
        updateNotification("ERP session expired on server. Tap to re-login.");
    }

    private void parseAndPersistCookies(List<String> setCookies, String existingCookie) {
        if (setCookies == null || setCookies.isEmpty()) return;

        Map<String, String> cookieMap = new HashMap<>();
        if (existingCookie != null && !existingCookie.trim().isEmpty()) {
            for (String part : existingCookie.split(";")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2 && !kv[0].trim().isEmpty()) {
                    cookieMap.put(kv[0].trim(), kv[1].trim());
                }
            }
        }

        boolean updated = false;
        for (String raw : setCookies) {
            if (raw == null) continue;
            String cookiePart = raw.split(";")[0].trim();
            String[] kv = cookiePart.split("=", 2);
            if (kv.length == 2 && !kv[0].trim().isEmpty()) {
                String val = kv[1].trim();
                // Ignore expired/clearing values
                if (!val.isEmpty()) {
                    cookieMap.put(kv[0].trim(), val);
                    updated = true;
                }
            }
        }

        if (updated) {
            StringBuilder newCookieSb = new StringBuilder();
            for (Map.Entry<String, String> entry : cookieMap.entrySet()) {
                if (newCookieSb.length() > 0) newCookieSb.append("; ");
                newCookieSb.append(entry.getKey()).append("=").append(entry.getValue());
            }
            String merged = newCookieSb.toString();
            Log.d(TAG, "Sliding session cookie updated and persisted!");

            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_COOKIE, merged).apply();

            try {
                CookieManager cm = CookieManager.getInstance();
                for (Map.Entry<String, String> entry : cookieMap.entrySet()) {
                    cm.setCookie("https://erp.abes.ac.in", entry.getKey() + "=" + entry.getValue());
                }
                cm.flush();
            } catch (Exception e) {
                Log.w(TAG, "Could not update native CookieManager", e);
            }
        }
    }

    private String getActiveCookie() {
        // First check SharedPreferences for latest persisted sliding cookie
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String cookie = prefs.getString(KEY_COOKIE, null);
        if (cookie != null && !cookie.trim().isEmpty()) {
            return cookie.trim();
        }

        // Fallback: check Android native CookieManager
        try {
            String cmCookie = CookieManager.getInstance().getCookie("https://erp.abes.ac.in");
            if (cmCookie != null && !cmCookie.trim().isEmpty()) {
                return cmCookie.trim();
            }
        } catch (Exception ignored) {}

        return null;
    }

    private void stopSessionKeeper() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdownNow();
            scheduler = null;
        }
        cancelAlarm();

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_IS_RUNNING, false).apply();

        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "onTaskRemoved: Ensuring background keep-alive alarm continues");
        scheduleNextAlarm();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "ERP Session Heartbeat",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps your ABES ERP login session active in the background.");
            channel.setShowBadge(false);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String contentText) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = null;
        if (launchIntent != null) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, flags);
        }

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("ABES Portal Active")
                .setContentText(contentText)
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .build();
    }

    private void updateNotification(String contentText) {
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, buildNotification(contentText));
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        // Only clean up resources if stopped
        cancelAlarm();
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdownNow();
            scheduler = null;
        }
        super.onDestroy();
    }
}
