import type { ArchitectureResult, ProjectSpec } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5065";

export async function generateArchitecture(spec: ProjectSpec): Promise<ArchitectureResult> {
  const response = await fetch(`${API_BASE_URL}/api/projects/generate-architecture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(spec),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.json() as Promise<ArchitectureResult>;
}

export async function exportBomCsv(result: ArchitectureResult): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/projects/export-bom-csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.blob();
}

export async function generateMarkdownReport(result: ArchitectureResult): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/projects/generate-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return response.text();
}
