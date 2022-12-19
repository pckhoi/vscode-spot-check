from datetime import datetime
import sys
import random
import json
from typing import Callable, Union

import pandas as pd


def _serialize_value(v):
    if isinstance(v, pd.Series):
        raise ValueError("unexpected record value %s" % v)
    if type(v) is list or type(v) is dict:
        return json.dumps(v, indent=2)
    if pd.isna(v):
        return None
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    return v


def print_samples(
    data: pd.DataFrame,
    resolve_source_path: Callable[[pd.Series], str],
    resolve_pageno: Union[Callable[[pd.Series], int], None] = None,
    number_of_samples: int = 100,
    sort: bool = True,
    exit_on_success: bool = True,
):
    """Samples random rows and print them as JSON

    This function only work if the first shell argument is "printSamples"

    Args:
        data (pd.DataFrame):
            the data to sample
        resolve_source_path ((pd.Series) -> str):
            given a row from the data, this function must return the
            absolute path to source PDF file
        resolve_pageno (pd.Series) -> int):
            given a row from the data, this function must return the page
            number of the PDF. Optional.
        number_of_samples (int):
            number of samples to produce with each incantation
        sort (bool):
            sort the samples according to the original row order
        exit_on_success (bool):
            exit the program when this function print samples successfully

    Returns:
        nothing

    Examples:
        this function should be put inside the main block, after data processing
        code, but before data saving code. This way, the script serves multiple
        purposes: printing samples when given "printSamples" argument but carry
        on saving data otherwise.

        >>> if __name__ == '__main__':
        ...     # data processing code...
        ...     print_samples(
        ...         data,
        ...         resolve_source_path=lambda row: pathlib.Path(__file__).parent.parent / row.filepath,
        ...         resolve_pageno=lambda row: row.pagenumber,
        ...     )
        ...     # data saving code...
    """
    if len(sys.argv) < 2 or sys.argv[1] != "printSamples":
        return
    total = len(data)
    if total == 0:
        raise ValueError("data has no row")
    else:
        random.seed()
        n = min(total, number_of_samples)
        indices = set()
        while True:
            for i in range(0, 5):
                v = random.randint(0, total - 1)
                if v not in indices:
                    indices.add(v)
                    break
            else:
                break
            if len(indices) >= n:
                break
        if sort:
            indices = sorted(indices)
        else:
            indices = list(indices)
        print(
            json.dumps(
                [
                    {
                        "sourcePath": str(resolve_source_path(row)),
                        "pageNumber": None
                        if resolve_pageno is None
                        else resolve_pageno(row),
                        "record": {
                            k: _serialize_value(v) for k, v in row.to_dict().items()
                        },
                    }
                    for _, row in data.iloc[indices].iterrows()
                ],
                allow_nan=False,
            )
        )
    if exit_on_success:
        sys.exit(0)
