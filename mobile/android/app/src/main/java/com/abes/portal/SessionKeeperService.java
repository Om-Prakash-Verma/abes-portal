package com.abes.portal;

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
import android.util.Log;
import android.webkit.CookieManager;

import androidx.core.app.NotificationCompat;

import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class SessionKeeperService extends Service {

    private static final String TAG = "SessionKeeperService";
    public static final String ACTION_START = "com.abes.portal.ACTION_START";
    public static final String ACTION_STOP = "com.abes.portal.ACTION_STOP";
    public static final String ACTION_PING = "com.abes.portal.ACTION_PING";

    public static final String PREFS_NAME = "abes_session_prefs";
    public static final String KEY_COOKIE = "cookie";
    public static final String KEY_LAST_PING = "last_ping_timestamp";
    public static final String KEY_IS_RUNNING = "is_running";

    private static final String CHANNEL_ID = "abes_erp_session_channel";
    private static final int NOTIFICATION_ID = 2024;
    private static final String ERP_URL = "https://erp.abes.ac.in/KeepSessionAlive.aspx";
    private static final long PING_INTERVAL_MINUTES = 10; // Ping every 10 minutes (server expires at 20 min)

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

        if (ACTION_PING.equals(action)) {
            // Immediate one-off ping
            triggerSinglePing();
        } else {
            // Start periodic scheduled pings
            startScheduledPings();
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
        // Run first ping immediately, then repeat every 10 minutes
        scheduler.scheduleWithFixedDelay(this::pingServer, 1, PING_INTERVAL_MINUTES, TimeUnit.MINUTES);
    }

    private void triggerSinglePing() {
        Executors.newSingleThreadExecutor().execute(this::pingServer);
    }

    private void pingServer() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = null;
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ABESPortal:SessionKeeperWakeLock");
            wakeLock.acquire(30000); // 30-sec safety timeout
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
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            conn.setInstanceFollowRedirects(false); // Detect 302 directly
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) ABESPortalMobile/1.0");
            conn.setRequestProperty("Cookie", cookie);

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "KeepSessionAlive response code: " + responseCode);

            long now = System.currentTimeMillis();
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            if (responseCode == 200) {
                prefs.edit().putLong(KEY_LAST_PING, now).apply();
                SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                String timeStr = sdf.format(new Date(now));
                updateNotification("ERP Session active • Last synced at " + timeStr);
            } else if (responseCode == 302) {
                // Redirect indicates session expired on the IIS server
                updateNotification("ERP session expired on server. Tap to re-login.");
            }

            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "KeepSessionAlive request failed", e);
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }

    private String getActiveCookie() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String cookie = prefs.getString(KEY_COOKIE, null);
        if (cookie != null && !cookie.isEmpty()) {
            return cookie;
        }

        // Fallback: check Android native CookieManager
        try {
            String cmCookie = CookieManager.getInstance().getCookie("https://erp.abes.ac.in");
            if (cmCookie != null && !cmCookie.isEmpty()) {
                return cmCookie;
            }
        } catch (Exception ignored) {}

        return null;
    }

    private void stopSessionKeeper() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdownNow();
            scheduler = null;
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_IS_RUNNING, false).apply();

        stopForeground(true);
        stopSelf();
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
                .setSmallIcon(R.mipmap.ic_launcher)
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
        stopSessionKeeper();
        super.onDestroy();
    }
}
