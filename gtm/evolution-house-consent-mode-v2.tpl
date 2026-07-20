___INFO___
{
  "type": "TAG",
  "id": "cvt_evolution_house_consent_mode_v2",
  "version": 1,
  "securityGroups": [],
  "displayName": "Evolution House — Consent Mode v2",
  "description": "Sets Consent Mode v2 defaults before measurement and updates analytics_storage from the Evolution House cookie banner.",
  "containerContexts": ["WEB"]
}

___TEMPLATE_PARAMETERS___
[]

___SANDBOXED_JS_FOR_WEB_TEMPLATE___
var setDefaultConsentState = require('setDefaultConsentState');
var updateConsentState = require('updateConsentState');
var getCookieValues = require('getCookieValues');
var callInWindow = require('callInWindow');

var COOKIE_NAME = 'eh_consent_v2';
var denied = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
};

function normalise(state) {
  return {
    analytics_storage: state && state.analytics_storage === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  };
}

// This tag must use the Consent Initialization — All Pages trigger.
setDefaultConsentState(denied);

var saved = getCookieValues(COOKIE_NAME);
if (saved.indexOf('analytics_granted') !== -1) {
  updateConsentState(normalise({ analytics_storage: 'granted' }));
}

// The on-page banner invokes this only after GTM has loaded. First-time consent
// is read from the cookie above, so it is already applied before Google tags fire.
callInWindow('ehAddConsentListener', function(state) {
  updateConsentState(normalise(state));
});
data.gtmOnSuccess();

___WEB_PERMISSIONS___
[
  {
    "instance": {
      "key": {"publicId": "access_consent", "versionId": "1"},
      "param": [
        {
          "key": "consentTypes",
          "value": {
            "type": 2,
            "listItem": [
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "analytics_storage"}, {"type": 8, "boolean": true}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "ad_storage"}, {"type": 8, "boolean": true}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "ad_user_data"}, {"type": 8, "boolean": true}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "ad_personalization"}, {"type": 8, "boolean": true}, {"type": 8, "boolean": true}]}
            ]
          }
        }
      ]
    },
    "clientAnnotations": {"isEditedByUser": true},
    "isRequired": true
  },
  {
    "instance": {
      "key": {"publicId": "get_cookies", "versionId": "1"},
      "param": [{"key": "cookieNames", "value": {"type": 2, "listItem": [{"type": 1, "string": "eh_consent_v2"}]}}]
    },
    "clientAnnotations": {"isEditedByUser": true},
    "isRequired": true
  },
  {
    "instance": {
      "key": {"publicId": "access_globals", "versionId": "1"},
      "param": [{"key": "keys", "value": {"type": 2, "listItem": [{"type": 3, "mapKey": [{"type": 1, "string": "key"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}, {"type": 1, "string": "execute"}], "mapValue": [{"type": 1, "string": "ehAddConsentListener"}, {"type": 8, "boolean": false}, {"type": 8, "boolean": false}, {"type": 8, "boolean": true}]}]}}]
    },
    "clientAnnotations": {"isEditedByUser": true},
    "isRequired": true
  }
]

___TESTS___
scenarios: []

___NOTES___
Use one tag instance on Consent Initialization — All Pages. Do not add additional consent checks to Google Analytics tags.
