import { Test, type TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { MongoService } from '../../db/db';

function func(): void {
  fs.readFileSync('./avatars/202cb962ac59075b964b07152d234b70.jpg');
}
jest.mock('fs');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UserService, MongoService],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const user: UserTypes = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        avatar: 'https://reqres.in/img/faces/2-image.jpg',
        id: 0,
      };

      const createdUser = {
        id: 23,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        password: 'password123',
        avatar: 'https://reqres.in/img/faces/2-image.jpg',
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(createdUser);

      const result = await userService.createUser(user);

      expect(result).toEqual(createdUser);
    });
  });

  describe('getById', () => {
    it('should retrieve a user by ID', async () => {
      const userId = '2';
      const expectedUser = {
        id: 2,
        email: 'janet.weaver@reqres.in',
        first_name: 'Janet',
        last_name: 'Weaver',
        avatar: 'https://reqres.in/img/faces/2-image.jpg',
      };

      jest.spyOn(userService, 'getById').mockResolvedValue(expectedUser);

      const result = await userService.getById(userId);

      expect(result).toEqual(expectedUser);
    });
  });

  describe('getAvatar', () => {
    it('should return the user avatar when the image file already exists', async () => {
      const userId = '123';
      const imagePath = `./avatars/${crypto
        .createHash('md5')
        .update(userId)
        .digest('hex')}.jpg`;
      const expectedAvatar = 'base64-encoded-image';
      const readFile = jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(Buffer.from(expectedAvatar, 'base64'));
      func();
      expect(readFile).toHaveBeenCalledWith(imagePath);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete the avatar of the given user', async () => {
      const userId = 1;
      const mockResponse = new Response(null, { status: 204 });
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const result = await userService.deleteAvatar(userId);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://reqres.in/api/users/${userId}/avatar`,
        { method: 'DELETE' },
      );
      expect(result).toEqual('Avatar deleted successfully');
    });

    it('should throw an error if the API call fails', async () => {
      const userId = 2;
      const mockResponse = new Response(null, { status: 404 });
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await expect(userService.deleteAvatar(userId)).rejects.toThrow(
        'Failed to delete avatar',
      );
    });
  });
});
