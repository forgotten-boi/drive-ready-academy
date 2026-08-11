import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html'
})
export class App {
  // Injected (not just called) so the service's constructor-time theme
  // setup runs as soon as the app root exists, before first paint.
  private readonly themeService = inject(ThemeService);
}
