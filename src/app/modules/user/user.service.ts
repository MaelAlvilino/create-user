import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { MongoService } from '../../db/db';

@Injectable()
export class UserService {
  constructor(readonly mongoService: MongoService) {}

  async createUser(user: UserTypes): Promise<UserTypes> {
    const response = await fetch('https://reqres.in/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const createdUser = await response.json();
    console.log(createdUser);

    const message = JSON.stringify(createdUser);
    const queue = 'user.created';

    try {
      const conn = await amqp.connect('amqp://localhost');
      const channel = await conn.createChannel();
      await channel.assertQueue(queue);
      channel.sendToQueue(queue, Buffer.from(message));
    } catch (error) {
      console.error(error);
    }

    return createdUser;
  }

  async sendEmail(email: string, message: string): Promise<any> {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'yourgmail@gmail.com',
        pass: 'yourpassword',
      },
    });

    const info = await transporter.sendMail({
      from: '"Your Name" <yourgmail@gmail.com>',
      to: email,
      subject: 'User created successfully!',
      text: message,
    });

    return info;
  }

  async getById(userId: string): Promise<UserTypes> {
    const response = await fetch(`https://reqres.in/api/users/${userId}`);
    const data = await response.json();
    return data.data;
  }

  async getAvatar(userId: string): Promise<string> {
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const imagePath = `./avatars/${hash}.jpg`;

    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return imageBuffer.toString('base64');
    } else {
      const url = `https://reqres.in/api/users/${userId}/avatar`;

      try {
        const response = await fetch(url);
        const imageBuffer = await response.arrayBuffer();

        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));

        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        return imageBase64;
      } catch (error) {
        console.error(error);
        return 'error';
      }
    }
  }

  async deleteAvatar(userId: number): Promise<string> {
    const response = await fetch(
      `https://reqres.in/api/users/${userId}/avatar`,
      {
        method: 'DELETE',
      },
    );
    if (!response.ok) {
      throw new Error('Failed to delete avatar');
    }
    return 'Avatar deleted successfully';
  }
}
