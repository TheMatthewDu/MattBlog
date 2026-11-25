---
title: Trillium Specs and Tips
date: 2026-11-21
summary: Tips on how to optimize your runs.
---

# Trillium Specifications

(Copied from [1])
* 235,008 cores provided by 1224 CPU compute nodes
* Each CPU compute node has 192 cores from two 96-core AMD EPYC 9655 CPUs ("Zen 5" a.k.a. "Turin") at 2.6 GHz (base frequency)  [2]
    * 96 CPU cores
    * 192 parallel threads
* Each CPU compute node has 755 GiB / 810 GB of available RAM
* The nodes are connected by a non-blocking (1:1) 400 Gb/s InfiniBand NDR interconnect
* This subcluster is designed for large-scale parallel workloads

The architecture is as follows:
```
┌──────────────────────────────────────────────────────────────────────┐
│ Trillium (CPU Subcluster)                                            │
│                                                                      │
│   ┌──────────────────────────────────────────────────────┐           │
│   │ Compute Node - 755 GiB (810 GB) Memory               │           │
│   │                                                      │           │
│   │   ┌────────────────────────────┐                     │           │
│   │   │ AMD EPYC 9655              │                     │           │
│   │   │ CPUs @ 2.6 GHz             │                     │           │
│   │   │                            │                     │           │
│   │   │   ┌────────┐               │                     │           │
│   │   │   │  Core  │  × 96         │        × 2          │   × 1224  │
│   │   │   └────────┘               │                     │           │
│   │   │                            │                     │           │
│   │   │   ╭────────╮               │                     │           │
│   │   │   │ Thread │  × 192        │                     │           │
│   │   │   ╰────────╯               │                     │           │
│   │   │                            │                     │           │
│   │   └────────────────────────────┘                     │           │
│   │                                                      │           │
│   └──────────────────────────────────────────────────────┘           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Tips for Performance Improvements

When working with large number of processors, it is often better to force the Operating System to bind memories to each processor to improve cache locality. This is especially important when working with large-scale CFD.

Using OpenMPI (`mpirun`), one can add these flags to the bash command to force the OS to bind memories to each processor.
``` bash
mpirun -n <num_procs> --map-by core --bind-to core ...
```

Writing to disk can also be very slow if saving every timestep. One "shortcut" to address this is to write to RAM instead and dump to disk later. Linux has a "shortcut" to achieve this using the filesystem, by using `\dev\shm`. 

The following creates a background process that checks `/dev/shm` everu second and moves all of the files to a target directory when it exceeds a certain `LIMIT`. It does not move files that have been touched in the past 5 seconds.
```bash
drain(){
  SRC=/dev/shm/out
  DST=$1 
  LIMIT=50   # % usage that triggers the dump

  while true; do
    sleep 1;
    [ "$(df --output=pcent /dev/shm | tr -dc 0-9)" -ge "$LIMIT" ] &&
      find "$SRC" -type f ! -newermt '5 seconds ago' -exec mv -t "$DST" {} +
  done
}

mkdir /dev/shm/out
```

To run, add this to your main executable,
# IMPORTANT: DO NOT FORGET TO MOVE EVERYTHING FROM `/dev/shm/out` TO YOUR RESULTS FOLDER AT THE END!!!! THE `drain` FUNCTION DOES NOT DO IT MANUALLY. THE FOLDER IS WIPED AFTER A PROGRAM TERMINATES, SO ANYTHING IN THERE THAT IS NOT SAVED WILL BE DELETED. YOU HAVE BEEN WARNED...
```bash
drain $results_folder & <executable here>

mv /dev/shm/out/* $results_folder # **IMPORTANT**
```

The code works as follows:
* `"$(df --output=pcent /dev/shm | tr -dc 0-9)"`: Gets the amount (in percent) fill of `/dev/shm`. Keep only numbers
* `[ <cmd> -ge "$LIMIT" ]`: Checks if the output of the command is greater or equal to `$LIMIT`
* `find "$SRC" -type f ! -newermt '5 seconds ago' -exec mv -t "$DST" {} +`: Find all of the files that have not been touched in the past 5 seconds to the provided directory.

## References
[1]  https://docs.alliancecan.ca/wiki/Trillium_Quickstart#Overview

[2]  https://www.amd.com/en/products/processors/server/epyc/9005-series/amd-epyc-9655.html
