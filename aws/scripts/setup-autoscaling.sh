#!/usr/bin/env bash
# Configures ECS Application Auto Scaling for logitrans-server.
# Run once after the ECS service is created (or re-run to update thresholds).
#
# Prerequisites: aws CLI configured with sufficient IAM permissions.
# Usage: ./aws/scripts/setup-autoscaling.sh [cluster] [service]

set -euo pipefail

CLUSTER="${1:-cultivated-dolphin-i3b5dl}"
SERVICE="${2:-logitrans-server-service-i040w1y8}"
REGION="${AWS_REGION:-us-east-1}"
MIN_TASKS=3    # Never drop below 3 (absorbs sudden spikes while scaling out)
MAX_TASKS=10   # Upper ceiling

RESOURCE_ID="service/${CLUSTER}/${SERVICE}"

echo "==> Registering scalable target (min=${MIN_TASKS}, max=${MAX_TASKS})"
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id "$RESOURCE_ID" \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity "$MIN_TASKS" \
  --max-capacity "$MAX_TASKS" \
  --region "$REGION"

# ── Scale OUT: add 2 tasks when CPU > 50% for 1 consecutive minute ──────────
echo "==> Creating scale-out policy (CPU > 50%)"
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id "$RESOURCE_ID" \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name "${SERVICE}-scale-out" \
  --policy-type StepScaling \
  --step-scaling-policy-configuration '{
    "AdjustmentType": "ChangeInCapacity",
    "Cooldown": 60,
    "MetricAggregationType": "Average",
    "StepAdjustments": [
      { "MetricIntervalLowerBound": 0,  "MetricIntervalUpperBound": 20, "ScalingAdjustment": 2 },
      { "MetricIntervalLowerBound": 20, "MetricIntervalUpperBound": 40, "ScalingAdjustment": 3 },
      { "MetricIntervalLowerBound": 40, "ScalingAdjustment": 5 }
    ]
  }' \
  --region "$REGION"

# ── Scale IN: remove 1 task when CPU < 30% for 5 consecutive minutes ────────
echo "==> Creating scale-in policy (CPU < 30%)"
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id "$RESOURCE_ID" \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name "${SERVICE}-scale-in" \
  --policy-type StepScaling \
  --step-scaling-policy-configuration '{
    "AdjustmentType": "ChangeInCapacity",
    "Cooldown": 300,
    "MetricAggregationType": "Average",
    "StepAdjustments": [
      { "MetricIntervalUpperBound": 0, "ScalingAdjustment": -1 }
    ]
  }' \
  --region "$REGION"

# ── CloudWatch alarms that trigger the policies ──────────────────────────────
SCALE_OUT_ARN=$(aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "$RESOURCE_ID" \
  --query "ScalingPolicies[?PolicyName=='${SERVICE}-scale-out'].PolicyARN" \
  --output text --region "$REGION")

SCALE_IN_ARN=$(aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "$RESOURCE_ID" \
  --query "ScalingPolicies[?PolicyName=='${SERVICE}-scale-in'].PolicyARN" \
  --output text --region "$REGION")

echo "==> Creating CloudWatch alarm — scale-out trigger (CPU > 50%)"
aws cloudwatch put-metric-alarm \
  --alarm-name "${SERVICE}-cpu-high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --dimensions Name=ClusterName,Value="$CLUSTER" Name=ServiceName,Value="$SERVICE" \
  --statistic Average \
  --period 60 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions "$SCALE_OUT_ARN" \
  --region "$REGION"

echo "==> Creating CloudWatch alarm — scale-in trigger (CPU < 30%)"
aws cloudwatch put-metric-alarm \
  --alarm-name "${SERVICE}-cpu-low" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --dimensions Name=ClusterName,Value="$CLUSTER" Name=ServiceName,Value="$SERVICE" \
  --statistic Average \
  --period 60 \
  --evaluation-periods 5 \
  --threshold 30 \
  --comparison-operator LessThanOrEqualToThreshold \
  --alarm-actions "$SCALE_IN_ARN" \
  --region "$REGION"

echo ""
echo "Auto-scaling configured for ${CLUSTER}/${SERVICE}"
echo "  Min tasks : ${MIN_TASKS}"
echo "  Max tasks : ${MAX_TASKS}"
echo "  Scale-out : CPU >= 50% for 1 min  → +2/+3/+5 tasks"
echo "  Scale-in  : CPU <= 30% for 5 min  → -1 task"
echo ""
echo "Run to verify:"
echo "  aws application-autoscaling describe-scalable-targets --service-namespace ecs --region ${REGION}"
