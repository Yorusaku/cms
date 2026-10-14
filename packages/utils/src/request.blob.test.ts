import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Request from "./request";

const CSV_BODY = '\uFEFF"姓名","手机号"\r\n"张三","13800138000"\r\n';
const ERROR_BODY = JSON.stringify({
  code: -1,
  message: "只有管理员可以导出线索",
  data: null,
});

let server: Server;
let baseURL = "";

beforeAll(async () => {
  server = createServer((req, res) => {
    // jsdom 的 XHR 会做同源检查，测试服务器需显式放行跨域
    res.setHeader("Access-Control-Allow-Origin", "*");
    const url = req.url ?? "";
    if (url.startsWith("/export.csv")) {
      res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8" });
      res.end(CSV_BODY);
      return;
    }
    // 本项目后端把业务异常统一包装成 HTTP 200 + JSON 业务包
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(ERROR_BODY);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseURL = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** jsdom 的 Blob 未实现 text()，用 FileReader 读取（浏览器中 blob.text() 可用） */
const readBlobText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

describe("Request.download", () => {
  it("二进制响应跳过业务包解包，原样返回文件 Blob", async () => {
    const request = new Request({ baseURL });

    const blob = await request.download("/export.csv");

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain("text/csv");
    expect(await readBlobText(blob)).toContain("张三");
  });

  it("业务异常（HTTP 200 + JSON）也以 Blob 返回，调用方可据 type 判定导出失败", async () => {
    const request = new Request({ baseURL });

    const blob = await request.download("/export-forbidden");

    expect(blob.type).toContain("application/json");
    const body = JSON.parse(await readBlobText(blob)) as { message: string };
    expect(body.message).toBe("只有管理员可以导出线索");
  });
});
