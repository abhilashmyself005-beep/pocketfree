package com.pocketfree.app;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "PhoneSmsReader",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS }
        )
    }
)
public class PhoneSmsReaderPlugin extends Plugin {

    @PluginMethod
    public void getHistoricSms(PluginCall call) {
        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
        } else {
            loadSmsInbox(call);
        }
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            loadSmsInbox(call);
        } else {
            call.reject("Permission to read phone SMS was denied by user.");
        }
    }

    private void loadSmsInbox(PluginCall call) {
        try {
            ContentResolver contentResolver = getContext().getContentResolver();
            Uri uri = Uri.parse("content://sms/inbox");
            int limit = call.getInt("limit", 1000);

            Cursor cursor = contentResolver.query(
                uri,
                new String[] { "_id", "address", "body", "date" },
                null,
                null,
                "date DESC"
            );

            JSArray smsList = new JSArray();
            int count = 0;

            if (cursor != null && cursor.moveToFirst()) {
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    String address = addressIdx != -1 ? cursor.getString(addressIdx) : "";
                    String body = bodyIdx != -1 ? cursor.getString(bodyIdx) : "";
                    long date = dateIdx != -1 ? cursor.getLong(dateIdx) : System.currentTimeMillis();

                    if (body != null && body.trim().length() > 0) {
                        JSObject smsObj = new JSObject();
                        smsObj.put("address", address != null ? address : "");
                        smsObj.put("body", body);
                        smsObj.put("date", date);
                        smsList.put(smsObj);
                        count++;
                    }

                    if (count >= limit) {
                        break;
                    }
                } while (cursor.moveToNext());

                cursor.close();
            }

            JSObject result = new JSObject();
            result.put("messages", smsList);
            result.put("count", count);
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to query phone SMS inbox: " + e.getMessage(), e);
        }
    }
}
