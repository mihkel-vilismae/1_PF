# Raspberry address overlay device proof OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define the proof boundary for the v1 requirement that address/location text appears on the Raspberry/device display.

## Contract

The address overlay proof must show:

- native display/playback path observed;
- media item has address text or `unknown` location policy applied;
- overlay rendering is enabled for the native display path;
- operator observation or screenshot/photo evidence exists;
- evidence does not expose private full address unless explicitly allowed.

## Default overlay text

Until A2 is confirmed, the default minimum is city/country or `unknown`.

## Non-claims

- Dashboard-only address text does not satisfy device-display overlay.
- JSON state alone does not prove pixels were visible unless the user later accepts JSON-only evidence.
