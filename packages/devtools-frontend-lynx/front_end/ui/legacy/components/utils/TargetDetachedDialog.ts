// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable rulesdir/no_underscored_properties */

import * as i18n from '../../../../core/i18n/i18n.js';
import * as SDK from '../../../../core/sdk/sdk.js';
import type * as ProtocolProxyApi from '../../../../generated/protocol-proxy-api.js';
import type * as Protocol from '../../../../generated/protocol.js';
import * as UI from '../../legacy.js';

const UIStrings = {
  /**
  *@description Text on the remote debugging window to indicate the connection is lost
  */
  websocketDisconnected: 'WebSocket disconnected',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/utils/TargetDetachedDialog.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class TargetDetachedDialog extends SDK.SDKModel.SDKModel implements ProtocolProxyApi.InspectorDispatcher {
  _hideCrashedDialog: (() => void)|null;
  constructor(target: SDK.Target.Target) {
    super(target);
    target.registerInspectorDispatcher(this);
    target.inspectorAgent().invoke_enable();
    this._hideCrashedDialog = null;
  }

  detached({reason}: Protocol.Inspector.DetachedEvent): void {
    // Remove pop-up window and change to console log
    console.error('Devtool terminated. ', reason);
    // UI.RemoteDebuggingTerminatedScreen.RemoteDebuggingTerminatedScreen.show(reason);
  }

  static webSocketConnectionLost(): void {
    // Remove pop-up window and change to console log
    console.error('Devtool terminated. ', i18nString(UIStrings.websocketDisconnected))
    // UI.RemoteDebuggingTerminatedScreen.RemoteDebuggingTerminatedScreen.show(
    //     i18nString(UIStrings.websocketDisconnected));
  }

  targetCrashed(): void {
    // In case of service workers targetCrashed usually signals that the worker is stopped
    // and in any case it is restarted automatically (in which case front-end will receive
    // targetReloadedAfterCrash event).
    if (this.target().parentTarget()) {
      return;
    }
    const dialog = new UI.Dialog.Dialog();
    dialog.setSizeBehavior(UI.GlassPane.SizeBehavior.MeasureContent);
    dialog.addCloseButton();
    dialog.setDimmed(true);
    this._hideCrashedDialog = dialog.hide.bind(dialog);
    new UI.TargetCrashedScreen
        .TargetCrashedScreen(() => {
          this._hideCrashedDialog = null;
        })
        .show(dialog.contentElement);

    // UI.Dialog extends GlassPane and overrides the `show` method with a wider
    // accepted type. However, TypeScript uses the supertype declaration to
    // determine the full type, which requires a `!Document`.
    // @ts-ignore
    dialog.show();
  }

  /** ;
   */
  targetReloadedAfterCrash(): void {
    this.target().runtimeAgent().invoke_runIfWaitingForDebugger();
    if (this._hideCrashedDialog) {
      this._hideCrashedDialog.call(null);
      this._hideCrashedDialog = null;
    }
  }
}

SDK.SDKModel.SDKModel.register(TargetDetachedDialog, {capabilities: SDK.Target.Capability.Inspector, autostart: true});
