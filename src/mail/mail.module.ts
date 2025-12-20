import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';
import * as Handlebars from 'handlebars';

// Register custom Handlebars helpers
Handlebars.registerHelper('eq', function (v1, v2) {
  return v1 === v2;
});
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Determine if we're in production/built mode or development mode
        const templateDir = join(
          process.cwd(),
          process.env.NODE_ENV === 'production'
            ? 'dist/mail/templates'
            : 'src/mail/templates',
        );

        console.log(`Email template directory: ${templateDir}`);

        return {
          transport: {
            host: config.get('MAIL_HOST'),
            port: config.get('MAIL_PORT'),
            secure: config.get('MAIL_SECURE') === 'true',
            auth: {
              user: config.get('MAIL_USER'),
              pass: config.get('MAIL_PASSWORD'),
            },
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
