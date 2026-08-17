package com.kalanacademy.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // =====================================================
        // 🔒 PROTECTION N°2
        // Empêche les captures et enregistrements d'écran
        // =====================================================

        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
        );

        // =====================================================
        // 🔒 PROTECTION N°3
        // Protection contre la copie facile des contenus
        // pédagogiques dans la WebView Android
        // =====================================================

        WebView webView = getBridge().getWebView();

        if (webView != null) {

            // Désactive la sélection de texte
            webView.setOnLongClickListener(v -> true);

            // Désactive le menu contextuel associé
            webView.setLongClickable(false);

            // Désactive le copier/coller natif de la WebView
            webView.setHapticFeedbackEnabled(false);
        }
    }
}
