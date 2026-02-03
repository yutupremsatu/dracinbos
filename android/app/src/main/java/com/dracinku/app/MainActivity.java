package com.dracinku.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the GoogleAuth plugin
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);
    }
}
