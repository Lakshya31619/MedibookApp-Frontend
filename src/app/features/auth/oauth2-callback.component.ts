import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: `
    <div class="min-h-screen bg-navy-700 flex items-center justify-center">
      <div class="text-center text-white page-enter">
        <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-navy-200">Completing sign in…</p>
      </div>
    </div>
  `
})
export class OAuth2CallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.auth.handleOAuth2Callback(token);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
