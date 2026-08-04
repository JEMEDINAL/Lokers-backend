import { IsEnum, IsNotEmpty, MinLength } from 'class-validator';


export class CreateUserDto {

  @IsNotEmpty()
  username: string;

  @MinLength(6)
  password: string;

 
}