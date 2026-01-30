<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>404 - Page Not Found</title>
        <style>
            :root {
                color-scheme: light;
                font-family: "Instrument Sans", "Segoe UI", system-ui, -apple-system, sans-serif;
            }

            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }

            body {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #0b1d3a;
                color: #0b1d3a;
            }

            .page {
                position: relative;
                width: min(1100px, 92vw);
                min-height: min(720px, 92vh);
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(236, 246, 255, 0.86));
                border-radius: clamp(18px, 3vw, 32px);
                box-shadow: 0 20px 60px rgba(4, 21, 55, 0.35);
                overflow: hidden;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: clamp(20px, 4vw, 48px);
            }

            .page::before {
                content: "";
                position: absolute;
                inset: 0;
                background-image: url("{{ asset('img/bg.png') }}");
                background-size: cover;
                background-position: center;
                opacity: 0.18;
            }

            .content {
                position: relative;
                z-index: 1;
                padding: clamp(24px, 6vw, 64px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: clamp(16px, 3vw, 24px);
            }

            .logo {
                width: min(360px, 80%);
                height: auto;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border-radius: 999px;
                background: rgba(12, 64, 150, 0.1);
                color: #0c4096;
                font-weight: 600;
                font-size: 0.95rem;
            }

            h1 {
                font-size: clamp(2.4rem, 5vw, 3.5rem);
                color: #0b2b62;
                font-weight: 700;
            }

            p {
                font-size: clamp(1rem, 2.4vw, 1.2rem);
                color: #23406b;
                line-height: 1.6;
            }

            .actions {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }

            .btn {
                text-decoration: none;
                padding: 12px 22px;
                border-radius: 999px;
                font-weight: 600;
                transition: all 0.2s ease;
                border: 1px solid transparent;
            }

            .btn-primary {
                background: #0c4096;
                color: #fff;
                box-shadow: 0 10px 24px rgba(12, 64, 150, 0.3);
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px rgba(12, 64, 150, 0.35);
            }

            .btn-outline {
                background: rgba(255, 255, 255, 0.7);
                color: #0c4096;
                border-color: rgba(12, 64, 150, 0.3);
            }

            .illustration {
                position: relative;
                z-index: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: clamp(24px, 5vw, 56px);
            }

            .orb {
                width: min(320px, 70vw);
                aspect-ratio: 1;
                border-radius: 50%;
                background: radial-gradient(circle at top, rgba(255, 255, 255, 0.9), rgba(12, 64, 150, 0.15));
                display: grid;
                place-items: center;
                text-align: center;
                font-weight: 700;
                font-size: clamp(3rem, 8vw, 4.5rem);
                color: #0c4096;
                box-shadow: inset 0 0 40px rgba(12, 64, 150, 0.2), 0 20px 40px rgba(12, 64, 150, 0.2);
            }

            .orb span {
                display: block;
                font-size: clamp(1rem, 2vw, 1.1rem);
                font-weight: 500;
                color: #2e4f7b;
                margin-top: 8px;
            }

            @media (max-width: 720px) {
                body {
                    padding: 20px 0;
                }

                .page {
                    min-height: auto;
                }

                .actions {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        </style>
    </head>
    <body>
        <main class="page">
            <section class="content">
                <img class="logo" src="{{ asset('img/asean_banner_logo.png') }}" alt="ASEAN Philippines 2026 logo">
                <span class="badge">Page not found</span>
                <h1>Oops! We can’t find that page.</h1>
                <p>
                    The link might be broken or the page may have moved. Let’s get you back on track and exploring the
                    ASEAN Higher Education Sector site.
                </p>
                <div class="actions">
                    <a class="btn btn-primary" href="{{ url('/') }}">Return to homepage</a>
                    <a class="btn btn-outline" href="{{ url('/contact') }}">Contact support</a>
                </div>
            </section>
            <section class="illustration">
                <div class="orb">
                    404
                    <span>Lost in the clouds</span>
                </div>
            </section>
        </main>
    </body>
</html>
