import * as mongoose from 'mongoose';

export const UserAvatarSchema = new mongoose.Schema({
    userId: String,
    avatarHash: String,
    filePath: String,
});
