package com.abes.portal;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SessionKeeper")
public class SessionKeeperPlugin extends Plugin {

    @PluginMethod
    public void startService(PluginCall call) {
        Context context = getContext();
        String cookie = call.getString("cookie", "");

        SharedPreferences prefs = context.getSharedPreferences(SessionKeeperService.PREFS_NAME, Context.MODE_PRIVATE);
        if (cookie != null && !cookie.isEmpty()) {
            prefs.edit().putString(SessionKeeperService.KEY_COOKIE, cookie).apply();
        }

        Intent intent = new Intent(context, SessionKeeperService.class);
        intent.setAction(SessionKeeperService.ACTION_START);
        if (cookie != null && !cookie.isEmpty()) {
            intent.putExtra(SessionKeeperService.KEY_COOKIE, cookie);
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
            JSObject ret = new JSObject();
            ret.put("status", "started");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to start SessionKeeperService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(SessionKeeperService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(SessionKeeperService.KEY_COOKIE).apply();

        Intent intent = new Intent(context, SessionKeeperService.class);
        intent.setAction(SessionKeeperService.ACTION_STOP);
        try {
            context.stopService(intent);
            JSObject ret = new JSObject();
            ret.put("status", "stopped");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to stop SessionKeeperService: " + e.getMessage());
        }
    }

    @PluginMethod
    public void pingNow(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, SessionKeeperService.class);
        intent.setAction(SessionKeeperService.ACTION_PING);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
            JSObject ret = new JSObject();
            ret.put("status", "ping_requested");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to trigger ping: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(SessionKeeperService.PREFS_NAME, Context.MODE_PRIVATE);
        boolean isRunning = prefs.getBoolean(SessionKeeperService.KEY_IS_RUNNING, false);
        long lastPing = prefs.getLong(SessionKeeperService.KEY_LAST_PING, 0);

        JSObject ret = new JSObject();
        ret.put("isRunning", isRunning);
        ret.put("lastPingTimestamp", lastPing);
        call.resolve(ret);
    }
}
