import {
  BadGatewayException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as PdfPrinter from 'pdfmake';
import font = require('pdfmake/build/vfs_fonts.js');
import * as nodemailer from 'nodemailer';

interface tokenAndEmail {
  token: string;
  emailDestino: string;
}

@Controller()
export class AppController {
  @Post()
  async sendTextAsPdf(@Body() body: tokenAndEmail) {
    const { token } = body;
    //Verificando que el token sea enviado
    //token puede ser un string random cualquiera
    if (!token)
      throw new UnauthorizedException({
        message: 'Por favor inicie sesión para seguir',
      });

    //Ruta hacia el json con la data
    const jsonPath: string = path.join(__dirname, '../src/db/text.json');
    //Leyendo el contenido del Json
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    //Convirtiendo el JSON a un objecto de javascript
    const decoded = JSON.parse(jsonContent);
    //Estilos para los roles mostrados en el pdf
    const styles = {
      header: {
        bold: true,
      },
    };

    //Array que va a contener objetos solo los datos necesarios en formato {text: valor} para ser usados al generar el pdf
    const data = [];
    decoded.Transcript.forEach((object) => {
      const content = {
        text: object.Content,
      };
      const sentiment = {
        text: object.Sentiment,
      };
      const participantRole = {
        text: object.ParticipantRole,
        style: 'header',
      };
      const beginOffsetMillis = {
        text: `Start: ${object.BeginOffsetMillis}`,
      };
      const endOffsetMillis = {
        text: `End: ${object.EndOffsetMillis}`,
      };
      const separador = {
        text: '---------------------------------------------------------------------------------------------------------------------------------------------------',
      };

      data.push(
        participantRole,
        beginOffsetMillis,
        content,
        sentiment,
        endOffsetMillis,
        separador,
      );
    });

    //options que se pasan para inicializar el creador de pdfs
    const docDefinition = {
      content: data,
      styles: styles,
    };

    //Fuentes para el texto del pdf
    const fonts = {
      Roboto: {
        normal: Buffer.from(font.pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(font.pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
      },
    };

    //inicializando printer de pdf
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    //Path de donde quedará guardado el archivo
    pdfDoc.pipe(fs.createWriteStream('pdf/pdfTest.pdf'));
    pdfDoc.end();

    //Email
    //Auth
    const mail = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'santiagoboe04@gmail.com',
        pass: 'bbhhekkzbewafjuv',
      },
    });

    const pdfPath = path.join(__dirname, '../pdf/pdfTest.pdf');
    body.emailDestino = 'william@fabioarias.co';
    const mailOptions = {
      from: 'santiagoboe04@gmail.com',
      to: body.emailDestino,
      subject: 'envío de Pdf automatizado prueba técnica back',
      text: 'PDF adjunto con el contenido del JSON y sus textos',
      attachments: [
        {
          filename: 'pdfTest.pdf',
          path: pdfPath,
          contentType: 'application/pdf',
        },
      ],
    };

    mail.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }
}
