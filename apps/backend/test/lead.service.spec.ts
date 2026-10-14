import { LeadService } from "../src/modules/lead/lead.service";
import { Lead } from "../src/modules/lead/entities/lead.entity";

const ADMIN = { id: "u-admin", username: "admin", role: "admin" as const };
const EDITOR = { id: "u-editor", username: "editor", role: "editor" as const };

const makeLead = (partial: Partial<Lead> = {}): Lead =>
  Object.assign(new Lead(), {
    id: 1,
    requestId: "req-1",
    name: "张三",
    phoneNumber: "13800138000",
    remark: null,
    pageId: 7,
    publishedVersionId: "7-v1",
    sessionId: "s-1",
    status: "new",
    followUpRemark: null,
    followedBy: null,
    followedAt: null,
    utm: { utm_source: "wechat" },
    channel: { src: "qr" },
    consentAccepted: true,
    consentAt: new Date("2026-09-01T00:00:00.000Z"),
    createdAt: new Date("2026-09-20T10:00:00.000Z"),
    updatedAt: new Date("2026-09-20T10:00:00.000Z"),
    ...partial,
  });

const createQueryBuilder = (rows: Lead[]) => {
  const qb: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const chain = jest.fn(() => qb);
  Object.assign(qb, {
    orderBy: chain,
    skip: chain,
    take: chain,
    where: chain,
    andWhere: chain,
    getManyAndCount: jest.fn(async () => [rows, rows.length]),
    getMany: jest.fn(async () => rows),
  });
  return qb;
};

interface RepoStubs {
  leadRepo: Record<string, jest.Mock>;
  publishLogRepo: Record<string, jest.Mock>;
  auditRepo: Record<string, jest.Mock>;
  createService: (options?: {
    rows?: Lead[];
    leadsQb?: Record<string, jest.Mock>;
    retentionDays?: string;
  }) => LeadService;
}

const createStubs = (): RepoStubs => {
  const leadRepo = {
    findOne: jest.fn(),
    create: jest.fn((input: Partial<Lead>) => input as Lead),
    save: jest.fn(async (input: Lead) => ({ ...input, id: 1 })),
    remove: jest.fn(async (rows: Lead[]) => rows),
    createQueryBuilder: jest.fn(() => createQueryBuilder([])),
  };
  const publishLogRepo = {
    findOne: jest.fn(async () => ({ versionId: "7-v1", pageId: 7 })),
  };
  const auditRepo = {
    create: jest.fn((input: unknown) => input),
    save: jest.fn(async (input: unknown) => input),
  };

  const createService: RepoStubs["createService"] = (options = {}) => {
    const retention = options.retentionDays ?? "180";
    const configService = {
      get: jest.fn((key: string, fallback?: string) =>
        key === "LEAD_RETENTION_DAYS" ? retention : fallback,
      ),
    };
    return new LeadService(
      leadRepo as never,
      publishLogRepo as never,
      auditRepo as never,
      configService as never,
    );
  };

  return { leadRepo, publishLogRepo, auditRepo, createService };
};

const baseCreateDto = {
  requestId: "req-1",
  name: "张三",
  phoneNumber: "13800138000",
  pageId: 7,
  publishedVersionId: "7-v1",
  sessionId: "s-1",
};

describe("LeadService.createLead", () => {
  it("未同意隐私政策时拒绝写入", async () => {
    const { leadRepo, createService } = createStubs();
    const service = createService();

    await expect(
      service.createLead({ ...baseCreateDto, consentAccepted: false }),
    ).rejects.toThrow("提交线索前需要同意隐私政策");
    expect(leadRepo.save).not.toHaveBeenCalled();
  });

  it("相同 requestId 直接返回已有线索，不重复写入", async () => {
    const { leadRepo, createService } = createStubs();
    leadRepo.findOne.mockResolvedValue(makeLead({ id: 42 }));
    const service = createService();

    const result = await service.createLead({ ...baseCreateDto, consentAccepted: true });

    expect(result).toEqual({ id: 42, duplicated: true });
    expect(leadRepo.save).not.toHaveBeenCalled();
  });

  it("发布版本无效时拒绝写入", async () => {
    const { leadRepo, publishLogRepo, createService } = createStubs();
    leadRepo.findOne.mockResolvedValue(null);
    publishLogRepo.findOne.mockResolvedValue(null);
    const service = createService();

    await expect(
      service.createLead({ ...baseCreateDto, consentAccepted: true }),
    ).rejects.toThrow("页面发布版本无效，请刷新后重试");
  });

  it("正常写入时记录同意状态与同意时间", async () => {
    const { leadRepo, createService } = createStubs();
    leadRepo.findOne.mockResolvedValue(null);
    const service = createService();

    const result = await service.createLead({ ...baseCreateDto, consentAccepted: true });

    expect(result).toEqual({ id: 1, duplicated: false });
    const saved = leadRepo.save.mock.calls[0][0] as Lead;
    expect(saved.consentAccepted).toBe(true);
    expect(saved.consentAt).toBeInstanceOf(Date);
    expect(saved.status).toBe("new");
  });
});

describe("LeadService.getLeadList", () => {
  it("非管理员读取时手机号脱敏，并写访问审计", async () => {
    const { leadRepo, auditRepo, createService } = createStubs();
    const qb = createQueryBuilder([makeLead()]);
    leadRepo.createQueryBuilder.mockReturnValue(qb);
    const service = createService();

    const result = await service.getLeadList({ pageId: 7 }, EDITOR);

    expect(result.list[0].phoneNumber).toBe("138****8000");
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lead.view", actorUsername: "editor" }),
    );
  });

  it("管理员读取时保留完整手机号", async () => {
    const { leadRepo, createService } = createStubs();
    leadRepo.createQueryBuilder.mockReturnValue(createQueryBuilder([makeLead()]));
    const service = createService();

    const result = await service.getLeadList({ pageId: 7 }, ADMIN);

    expect(result.list[0].phoneNumber).toBe("13800138000");
  });
});

describe("LeadService.exportLeadCsv", () => {
  it("非管理员导出被拒绝", async () => {
    const { leadRepo, auditRepo, createService } = createStubs();
    leadRepo.createQueryBuilder.mockReturnValue(createQueryBuilder([makeLead()]));
    const service = createService();

    await expect(service.exportLeadCsv({ pageId: 7 }, EDITOR)).rejects.toThrow(
      "只有管理员可以导出线索",
    );
    expect(auditRepo.save).not.toHaveBeenCalled();
  });

  it("管理员导出包含表头与线索行，并写导出审计", async () => {
    const { leadRepo, auditRepo, createService } = createStubs();
    leadRepo.createQueryBuilder.mockReturnValue(createQueryBuilder([makeLead()]));
    const service = createService();

    const csv = await service.exportLeadCsv({ pageId: 7 }, ADMIN);
    const lines = csv.split("\r\n");

    expect(lines[0]).toContain('"姓名"');
    expect(lines[0]).toContain('"手机号"');
    expect(lines[1]).toContain('"张三"');
    expect(lines[1]).toContain('"13800138000"');
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lead.export", actorUsername: "admin" }),
    );
  });
});

describe("LeadService 保留期策略与超期清理", () => {
  it("默认保留 180 天", async () => {
    const { createService } = createStubs();
    const service = createService();

    const policy = await service.getRetentionPolicy();

    expect(policy.retentionDays).toBe(180);
    const expectedCutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
    expect(Math.abs(Date.parse(policy.cutoffAt) - expectedCutoff)).toBeLessThan(5000);
  });

  it("可通过 LEAD_RETENTION_DAYS 覆盖，非法值回退默认", async () => {
    const { createService } = createStubs();

    expect((await createService({ retentionDays: "30" }).getRetentionPolicy()).retentionDays).toBe(30);
    expect((await createService({ retentionDays: "0" }).getRetentionPolicy()).retentionDays).toBe(180);
    expect((await createService({ retentionDays: "abc" }).getRetentionPolicy()).retentionDays).toBe(180);
  });

  it("dryRun 只统计不删除，写 preview 审计", async () => {
    const { leadRepo, auditRepo, createService } = createStubs();
    const expired = [makeLead({ id: 1 }), makeLead({ id: 2 })];
    leadRepo.createQueryBuilder.mockReturnValue(createQueryBuilder(expired));
    const service = createService();

    const result = await service.purgeExpiredLeads(ADMIN, true);

    expect(result).toMatchObject({ dryRun: true, matched: 2, deleted: 0 });
    expect(leadRepo.remove).not.toHaveBeenCalled();
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lead.purge_preview" }),
    );
  });

  it("正式清理删除超期线索并写 purge 审计", async () => {
    const { leadRepo, auditRepo, createService } = createStubs();
    const expired = [makeLead({ id: 1 }), makeLead({ id: 2 })];
    leadRepo.createQueryBuilder.mockReturnValue(createQueryBuilder(expired));
    const service = createService();

    const result = await service.purgeExpiredLeads(ADMIN, false);

    expect(result).toMatchObject({ dryRun: false, matched: 2, deleted: 2 });
    expect(leadRepo.remove).toHaveBeenCalledWith(expired);
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: "lead.purge" }),
    );
  });

  it("非管理员不能清理超期线索", async () => {
    const { leadRepo, createService } = createStubs();
    const service = createService();

    await expect(service.purgeExpiredLeads(EDITOR, false)).rejects.toThrow(
      "只有管理员可以清理超期线索",
    );
    expect(leadRepo.remove).not.toHaveBeenCalled();
  });
});
