import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from '../profiles/schemas/profile.schema';
import { CreateProfileDto } from '../profiles/dto/create-profile.dto';
import { UpdateProfileDto } from '../profiles/dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async createProfile(
    createProfileDto: CreateProfileDto,
  ): Promise<{ status: number; message: string; data?: any }> {
    const { userId } = createProfileDto;

    if (!userId || userId.trim() === '') {
      throw new BadRequestException({
        status: 400,
        message: "userId can't be empty",
      });
    }

    try {
      const existingProfile = await this.profileModel
        .findOne({ userId })
        .exec();
      if (existingProfile) {
        return {
          status: 409,
          message: 'Profile already exists for this user',
          data: existingProfile,
        };
      }

      const newProfile = new this.profileModel(createProfileDto);
      const savedProfile = await newProfile.save();

      return {
        status: 201,
        message: 'Profile created successfully',
        data: savedProfile,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 500,
        message: 'Profile creation failed',
        errors: error.message,
      });
    }
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<{ status: number; message: string; data?: any }> {
    try {
      const existingProfile = await this.profileModel.findByIdAndUpdate(
        id,
        updateProfileDto,
        { new: true },
      );

      if (!existingProfile) {
        throw new NotFoundException({
          status: 404,
          message: `Profile with ID ${id} not found`,
        });
      }

      return {
        status: 200,
        message: 'Profile updated successfully',
        data: existingProfile,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 500,
        message: 'Profile update failed',
        errors: error.message,
      });
    }
  }

  async getProfile(
    id: string,
  ): Promise<{ status: number; message: string; data?: any }> {
    try {
      const profile = await this.profileModel.findById(id).exec();
      if (!profile) {
        throw new NotFoundException({
          status: 404,
          message: `Profile with ID ${id} not found`,
        });
      }

      return {
        status: 200,
        message: 'Profile retrieved successfully',
        data: profile,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 500,
        message: 'Failed to retrieve profile',
        errors: error.message,
      });
    }
  }
}
