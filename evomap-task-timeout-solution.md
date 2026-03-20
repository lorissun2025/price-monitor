# 超时问题优化策略与架构模式

## 问题分析

当脚本使用 `timeout 600` 命令时，两次都超时（退出代码124），说明执行时间超过了600秒限制。这通常由以下原因造成：

### 常见原因

1. **I/O 密集型操作**：网络请求、文件读写、数据库查询
2. **计算密集型操作**：复杂计算、大数据处理
3. **外部依赖阻塞**：第三方 API 响应慢、网络延迟
4. **资源竞争**：CPU、内存、磁盘 I/O 争用
5. **低效算法**：嵌套循环、重复计算、未优化的数据结构

## 优化策略

### 1. 超时分层策略

```bash
# 基础超时：设置合理的全局超时
timeout 600 command

# 进阶：嵌套超时（外层保护内层）
timeout 600 bash -c '
  # 网络请求单独设置较短超时
  curl --max-time 30 --connect-timeout 10 https://api.example.com/data

  # 数据库操作设置连接超时
  psql -c "SET statement_timeout TO 300; SELECT * FROM large_table;"
'
```

### 2. 并行化处理

```bash
# 使用 GNU Parallel 并行执行任务
find data/*.json | parallel -j 4 --timeout 120 "process_file {}"

# 或使用 xargs
find data/*.json | xargs -P 4 -I {} process_file {}

# 或使用后台任务
for file in data/*.json; do
  process_file "$file" &
done
wait  # 等待所有后台任务完成
```

### 3. 增量处理与断点续传

```bash
# 分批处理大数据
TOTAL=$(wc -l < large_file.txt)
BATCH_SIZE=10000

for ((i=0; i<TOTAL; i+=BATCH_SIZE)); do
  tail -n +$((i+1)) large_file.txt | head -n $BATCH_SIZE | process_batch
  # 保存进度
  echo $i > progress.txt
done

# 或使用数据库游标
psql -c "DECLARE mycursor CURSOR FOR SELECT * FROM large_table;"
while psql -c "FETCH 1000 FROM mycursor;" | process_rows; do
  :
done
```

### 4. 缓存与去重

```bash
# 使用缓存避免重复计算
CACHE_DIR="/tmp/task_cache"
mkdir -p "$CACHE_DIR"

fetch_data() {
  local cache_key=$(echo "$1" | md5sum | cut -d' ' -f1)
  local cache_file="$CACHE_DIR/$cache_key"

  if [[ -f "$cache_file" && $(find "$cache_file" -mtime -1) ]]; then
    cat "$cache_file"
  else
    curl -s "$1" | tee "$cache_file"
  fi
}
```

### 5. 进度监控与早退

```bash
# 监控进度，提前终止超长任务
monitor_progress() {
  local start_time=$(date +%s)
  local max_duration=500  # 给100秒缓冲

  while true; do
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))

    if [[ $elapsed -gt $max_duration ]]; then
      echo "Progress too slow, aborting..." >&2
      kill $(jobs -p) 2>/dev/null
      return 124
    fi

    sleep 10
  done
}

monitor_progress &
monitor_pid=$!

# 主任务
your_long_running_task

kill $monitor_pid 2>/dev/null
```

## 架构模式

### 1. 生产者-消费者模式

```bash
# 生产者：将任务放入队列
produce_tasks() {
  for item in $(get_task_list); do
    echo "$item" > task_queue
  done
}

# 消费者：并行处理队列中的任务
consume_tasks() {
  while true; do
    if ! flock -n 9; then
      continue  # 队列被其他消费者占用
    fi

    task=$(head -n 1 task_queue)
    sed -i '' '1d' task_queue  # 移除已取任务
    flock -u 9

    [[ -z "$task" ]] && break

    timeout 120 process_task "$task"
  done
} 9> task_queue.lock

# 启动多个消费者
for i in {1..4}; do
  consume_tasks &
done
```

### 2. 重试与退避模式

```bash
# 指数退避重试
retry_with_backoff() {
  local max_retries=3
  local base_delay=5
  local attempt=0

  while [[ $attempt -lt $max_retries ]]; do
    if timeout 120 "$@"; then
      return 0
    fi

    attempt=$((attempt + 1))
    local delay=$((base_delay * (2 ** attempt)))
    echo "Attempt $attempt failed, retrying in ${delay}s..." >&2
    sleep $delay
  done

  return 1
}

retry_with_backoff curl -s https://api.example.com/data
```

### 3. 管道与流式处理

```bash
# 流式处理，避免内存爆炸
stream_process() {
  # 逐行处理大文件
  while IFS= read -r line; do
    process_line "$line"
  done < huge_file.txt
}

# 或使用管道链接工具
cat large_file.json \
  | jq -c '.[]' \
  | parallel -j 4 --timeout 30 'process_item' \
  | jq -s .
```

### 4. 断路器模式

```bash
# 监控失败率，超过阈值时断路
CIRCUIT_FILE="/tmp/circuit_state"
THRESHOLD=0.5
WINDOW_SIZE=10

check_circuit() {
  [[ ! -f "$CIRCUIT_FILE" ]] && return 0

  local state=$(cat "$CIRCUIT_FILE")
  [[ "$state" == "open" ]] && return 1
  return 0
}

update_circuit_stats() {
  local success=$1
  local stats_file="/tmp/circuit_stats"

  [[ ! -f "$stats_file" ]] && echo "0 0" > "$stats_file"

  local stats=($(cat "$stats_file"))
  local success_count=${stats[0]}
  local failure_count=${stats[1]}

  if [[ $success -eq 0 ]]; then
    failure_count=$((failure_count + 1))
  else
    success_count=$((success_count + 1))
  fi

  echo "$success_count $failure_count" > "$stats_file"

  local total=$((success_count + failure_count))
  if [[ $total -ge $WINDOW_SIZE ]]; then
    local failure_rate=$(echo "scale=2; $failure_count / $total" | bc)
    if (( $(echo "$failure_rate > $THRESHOLD" | bc -l) )); then
      echo "open" > "$CIRCUIT_FILE"
    fi
  fi
}

# 使用
if check_circuit; then
  if timeout 120 your_command; then
    update_circuit_stats 1
  else
    update_circuit_stats 0
  fi
fi
```

## 具体实施建议

### 针对 `timeout 600` 超时的检查清单

1. **分析瓶颈**
   ```bash
   # 使用 time 命令分析耗时
   time your_command

   # 使用 strace 跟踪系统调用
   strace -c your_command 2>&1 | sort -k2 -n

   # 使用 perf 分析 CPU 使用
   perf record your_command
   perf report
   ```

2. **网络优化**
   ```bash
   # 设置多个超时层级
   curl --max-time 300 --connect-timeout 30 --max-time 300 \
        --retry 3 --retry-delay 5 \
        https://api.example.com/data
   ```

3. **数据库优化**
   ```sql
   -- 设置查询超时
   SET statement_timeout TO 300;

   -- 使用 LIMIT 分批处理
   SELECT * FROM large_table ORDER BY id LIMIT 10000 OFFSET 0;

   -- 添加合适的索引
   CREATE INDEX idx_filter_column ON table(column);
   ```

4. **文件处理优化**
   ```bash
   # 使用更快的工具
   awk '{print}' large_file.txt > output.txt  # 比 sed 快
   ripgrep pattern large_dir/  # 比 grep 快

   # 使用流式处理避免内存问题
   zcat large_file.gz | process_stream
   ```

## 综合解决方案示例

```bash
#!/bin/bash
# 完整的超时优化脚本示例

set -euo pipefail

# 配置
MAX_TIMEOUT=550
NETWORK_TIMEOUT=30
DB_TIMEOUT=120
PARALLEL_JOBS=4
BATCH_SIZE=1000

# 进度跟踪
PROGRESS_FILE="/tmp/task_progress"
COUNTER=0

# 进度更新函数
update_progress() {
  echo "$(date): Processed $COUNTER items" >> "$PROGRESS_FILE"
}

# 批处理函数（带超时）
process_batch() {
  local batch_file=$1
  timeout 120 python3 process.py "$batch_file" || {
    echo "Batch $batch_file failed" >&2
    return 1
  }
}

# 主处理函数
process_data() {
  local input_file=$1
  local start_time=$(date +%s)

  # 分批处理
  split -l $BATCH_SIZE "$input_file" batch_
  local batch_count=$(ls batch_* | wc -l)

  # 并行处理批次
  ls batch_* | parallel -j $PARALLEL_JOBS \
    --timeout 120 \
    --joblog joblog.txt \
    --progress \
    process_batch {}

  # 清理临时文件
  rm -f batch_*

  # 计算耗时
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  echo "Completed in ${duration}s (${batch_count} batches)"
}

# 监控超时
monitor_and_abort() {
  local start_time=$(date +%s)

  while true; do
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))

    if [[ $elapsed -gt $MAX_TIMEOUT ]]; then
      echo "Timeout exceeded (${elapsed}s), aborting..." >&2
      pkill -P $$  # 杀掉所有子进程
      exit 124
    fi

    sleep 5
  done
}

# 主逻辑
main() {
  monitor_and_abort &
  monitor_pid=$!

  process_data "input_data.txt"

  kill $monitor_pid
  exit 0
}

trap "kill $monitor_pid 2>/dev/null; exit 1" ERR INT TERM
main "$@"
```

## 关键要点总结

1. **诊断优先**：先用 profiling 工具找到真正瓶颈
2. **分层超时**：设置不同级别的超时，避免一刀切
3. **并行化**：CPU 密集型任务充分利用多核
4. **流式处理**：大数据避免全加载到内存
5. **重试机制**：网络不稳定时自动重试
6. **进度可见**：实时监控进度，及时发现问题
7. **优雅降级**：超时时保存中间结果，方便续传
8. **资源限制**：使用 ulimit、cgroups 控制资源使用

---

通过以上策略的组合使用，可以有效解决脚本超时问题，提高系统稳定性和执行效率。
