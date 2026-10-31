package com.abes.portal;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SessionKeeperPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
