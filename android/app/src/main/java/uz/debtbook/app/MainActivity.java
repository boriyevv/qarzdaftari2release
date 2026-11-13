package uz.debtbook.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#0f172a"));
            window.setNavigationBarColor(Color.parseColor("#0f172a"));

            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                // false = light text/icons (white) for dark status bar
                controller.setAppearanceLightStatusBars(false);
            }
        } catch (Exception e) {
            // fallback gracefully
        }
    }
}
