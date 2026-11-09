import { motion } from "framer-motion";

export default function Privacy() {
  return (
    <main className="pt-16">
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 text-5xl font-bold">Privacy Policy</h1>
          <p className="mb-12 text-muted-foreground">Last updated: September 15, 2026</p>

          <div className="space-y-10 text-muted-foreground">
            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">1. Information we collect</h2>
              <p>
                When you create an account or use SOG TradePro, we may collect your name, email
                address, account credentials, transaction activity, and information you provide to
                support. We also collect technical information needed to keep the platform secure
                and reliable.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">2. How we use information</h2>
              <p>
                We use this information to create and secure your account, provide platform
                features, process account activity, respond to support requests, improve our
                services, and detect fraud or unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">3. Market data and third parties</h2>
              <p>
                The platform uses third-party market-data providers to display prices, charts, and
                related information. We do not sell your personal information. We may share
                information with service providers only when needed to operate, secure, or support
                the platform, or when required by law.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">4. Cookies and local storage</h2>
              <p>
                We may use cookies, local storage, or session storage to keep you signed in,
                remember your preferences, and maintain platform security. You can manage storage
                permissions through your browser settings, although some features may not work
                correctly without them.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">5. Security and retention</h2>
              <p>
                We use reasonable safeguards to protect account information. Information is kept
                only for as long as needed to provide the service, meet legal obligations, resolve
                disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">6. Your choices</h2>
              <p>
                You may request help accessing, correcting, or deleting personal information
                associated with your account, subject to applicable legal requirements. For privacy
                questions or requests, call us at{" "}
                <a className="text-primary hover:underline" href="tel:07038915140">
                  07038915140
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">7. Policy updates</h2>
              <p>
                We may update this policy when our services or legal obligations change. The
                updated version will be posted on this page with a revised update date.
              </p>
            </section>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
