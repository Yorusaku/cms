import http from "@/utils/http";

export interface DownloadFile {
  blob: Blob;
  filename: string;
}

/** 现代浏览器支持 blob.text()，jsdom（单测环境）没有该 API，回退 FileReader */
const readBlobText = (blob: Blob): Promise<string> => {
  if (typeof blob.text === "function") {
    return blob.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
};

/**
 * 下载后端文件流（CSV 导出等）。
 *
 * 本项目后端异常过滤器把所有异常统一包成 HTTP 200 + `{ code, message }`，
 * axios 会把它当成响应体包成 Blob，因此必须检查 `blob.type` 区分
 * 「真文件」与「错误信息」，否则会把错误提示当文件存下来。
 *
 * @param url 接口地址
 * @param params 查询参数
 * @param filename 前端落地文件名
 */
export const downloadFile = async (
  url: string,
  params: Record<string, unknown>,
  filename: string,
): Promise<DownloadFile> => {
  const blob = await http.download(url, { params } as never);

  if (blob.type.includes("application/json")) {
    const text = await readBlobText(blob);
    let message = "下载失败";
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // 解析失败时保留默认文案
    }
    throw new Error(message);
  }

  return { blob, filename };
};

/** 触发浏览器保存文件 */
export const saveBlob = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

/** 生成带时间戳的导出文件名，如 `线索导出-20260930-2119.csv` */
export const buildExportFilename = (prefix: string, extension = "csv") => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${prefix}-${stamp}.${extension}`;
};
