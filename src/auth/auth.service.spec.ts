import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService.register', () => {
  let service: AuthService;

  const mockUsersService = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('rechaza el registro si el username ya existe', async () => {
    mockUsersService.findByUsername.mockResolvedValue({ id: 1, username: 'admin' });

    await expect(service.register('admin', 'claveSegura123')).rejects.toThrow(ConflictException);
    expect(mockUsersService.create).not.toHaveBeenCalled();
  });

  it('crea el usuario con el password hasheado (nunca en texto plano)', async () => {
    mockUsersService.findByUsername.mockResolvedValue(null);
    mockUsersService.create.mockImplementation((data) =>
      Promise.resolve({ id: 2, username: data.username, passwordHash: data.passwordHash, role: 'admin' }),
    );

    const result = await service.register('maria', 'claveSegura123');

    expect(result).toEqual({ id: 2, username: 'maria', role: 'admin' });
    const createArg = mockUsersService.create.mock.calls[0][0];
    expect(createArg.passwordHash).not.toBe('claveSegura123');
  });
});
