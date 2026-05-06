import json
import sys
from pathlib import Path

import pandas as pd


def jsonl_to_excel(input_jsonl: str, output_excel: str = None):
    """
    将标准 JSONL 文件转换为 Excel 文件。

    参数:
        input_jsonl: 输入 .jsonl 文件路径
        output_excel: 输出 .xlsx 文件路径；若为 None，则自动生成同名 xlsx
    """
    input_path = Path(input_jsonl)

    if not input_path.exists():
        raise FileNotFoundError(f"找不到输入文件: {input_path}")

    if output_excel is None:
        output_path = input_path.with_suffix(".xlsx")
    else:
        output_path = Path(output_excel)

    records = []
    bad_lines = []

    with input_path.open("r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                records.append(obj)
            except json.JSONDecodeError as e:
                bad_lines.append((line_num, str(e), line))

    if not records:
        raise ValueError("没有成功解析到任何 JSON 记录，请检查输入文件是否为标准 JSONL 格式。")

    # 自动展开嵌套字段
    df = pd.json_normalize(records)

    # 写入 Excel
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="data")

        # 如果有坏行，也额外写一个 sheet 方便排查
        if bad_lines:
            bad_df = pd.DataFrame(bad_lines, columns=["line_number", "error", "raw_line"])
            bad_df.to_excel(writer, index=False, sheet_name="bad_lines")

    print(f"转换完成: {output_path}")
    print(f"成功记录数: {len(records)}")
    if bad_lines:
        print(f"失败行数: {len(bad_lines)}（已写入 sheet: bad_lines）")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python jsonl_to_excel.py input.jsonl [output.xlsx]")
        sys.exit(1)

    input_jsonl = sys.argv[1]
    output_excel = sys.argv[2] if len(sys.argv) > 2 else None

    jsonl_to_excel(input_jsonl, output_excel)