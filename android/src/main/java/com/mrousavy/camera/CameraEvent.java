package com.mrousavy.camera;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

import javax.annotation.Nullable;

public class CameraEvent extends Event {

    private String name;
    private WritableMap data;

    public CameraEvent(int viewId, String name, WritableMap data){
        super(viewId);
        this.name = name;
        this.data = data;
    }

    @Override
    public String getEventName() {
        return name;
    }


    @Nullable
    @Override
    protected WritableMap getEventData() {
        return data; // Has to be a map, but since we specified null in codegen it can be empty
    }
}
