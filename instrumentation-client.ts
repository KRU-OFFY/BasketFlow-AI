import { datadogRum } from '@datadog/browser-rum';
import { redactSensitiveText } from '@/lib/observability/redact';

const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;

if (applicationId && clientToken && !datadogRum.getInitConfiguration()) {
  datadogRum.init({
    applicationId,
    clientToken,
    site: 'ap1.datadoghq.com',
    service: 'basketflow-ai',
    env: process.env.NEXT_PUBLIC_DD_ENV || 'production',
    version: process.env.NEXT_PUBLIC_DD_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 0,
    trackUserInteractions: false,
    trackResources: false,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    beforeSend(event) {
      event.view.url = redactSensitiveText(event.view.url);

      if (event.type === 'error') {
        event.error.message = redactSensitiveText(event.error.message);
        if (event.error.stack) {
          event.error.stack = redactSensitiveText(event.error.stack);
        }
      }

      return true;
    },
  });
}
