import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ status: number; message: string; data?: any }> {
    const { email, password, username } = registerDto;

    const missingFields: string[] = [];
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!username) missingFields.push('username');

    if (missingFields.length > 0) {
      throw new BadRequestException({
        status: 400,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException({
        status: 409,
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = new this.userModel({
        email,
        password: hashedPassword,
        username,
      });

      const savedUser = await newUser.save();

      return {
        status: 201,
        message: 'User registered successfully',
        data: {
          id: savedUser._id,
          email: savedUser.email,
          name: savedUser.username,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 500,
        message: 'User registration failed',
        errors: error.message,
      });
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ status: number; message: string; data?: any }> {
    const { email, password } = loginDto;

    const missingFields: string[] = [];
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      throw new BadRequestException({
        status: 400,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new UnauthorizedException({
        status: 401,
        message: 'User does not exist',
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({
        status: 401,
        message: 'Invalid credentials',
      });
    }

    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    return {
      status: 200,
      message: 'Login successful',
      data: {
        access_token,
      },
    };
  }
}
