import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme.service';
import { PlatformInitService } from './core/services/platform-init.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html'
})
export class App {
  // Injected (not just called) so each service's constructor-time setup
  // runs as soon as the app root exists, before first paint.
  private readonly themeService = inject(ThemeService);
  private readonly platformInit = inject(PlatformInitService);
}
