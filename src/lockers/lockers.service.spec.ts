import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DoorStatus, LockerSize, OccupancyStatus } from '../common/enums/locker.enums';
import { Locker } from './locker.entity';
import { LockersService } from './lockers.service';

describe('LockersService', () => {
  let service: LockersService;

  const baseLocker: Locker = {
    id: 1,
    code: 'S-01',
    size: LockerSize.S,
    doorStatus: DoorStatus.CERRADO,
    occupancyStatus: OccupancyStatus.VACIO,
    reservations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn((locker) => Promise.resolve(locker)),
    find: jest.fn().mockResolvedValue([baseLocker]),
    create: jest.fn((dto) => dto),
  };

  beforeEach(async () => {
    mockRepository.findOne.mockResolvedValue({ ...baseLocker });

    const module: TestingModule = await Test.createTestingModule({
      providers: [LockersService, { provide: getRepositoryToken(Locker), useValue: mockRepository }],
    }).compile();

    service = module.get<LockersService>(LockersService);
  });

  it('rechaza marcar un casillero como OCUPADO si la puerta queda ABIERTA', async () => {
    await expect(
      service.updateStatus(1, {
        doorStatus: DoorStatus.ABIERTO,
        occupancyStatus: OccupancyStatus.OCUPADO,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('permite marcar un casillero como OCUPADO cuando la puerta está CERRADA', async () => {
    const result = await service.updateStatus(1, {
      doorStatus: DoorStatus.CERRADO,
      occupancyStatus: OccupancyStatus.OCUPADO,
    });
    expect(result.occupancyStatus).toBe(OccupancyStatus.OCUPADO);
    expect(result.doorStatus).toBe(DoorStatus.CERRADO);
  });

  it('permite abrir la puerta de un casillero vacío', async () => {
    const result = await service.updateStatus(1, { doorStatus: DoorStatus.ABIERTO });
    expect(result.doorStatus).toBe(DoorStatus.ABIERTO);
    expect(result.occupancyStatus).toBe(OccupancyStatus.VACIO);
  });
});
