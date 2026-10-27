package com.pocketfree.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PhoneSmsReaderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
