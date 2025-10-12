import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="container">
      <header>
        <h1>Welcome to Angular!</h1>
        <p>Start building your amazing Angular application.</p>
      </header>
      <main>
        <div class="card">
          <h2>Angular 16</h2>
          <p>This is a simple Angular starter template.</p>
        </div>
      </main>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .container {
        font-family: Arial, sans-serif;
        text-align: center;
        margin: 20px;
      }
      .card {
        padding: 20px;
        margin: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
    `,
  ],
})
export class AppComponent {
  title = 'angular-starter';
}
