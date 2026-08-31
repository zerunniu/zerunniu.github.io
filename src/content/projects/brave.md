---
title: "BRAVE: Block-wise Structural Regularization via Controlled Evidence Feedback for Reliable Label Aggregation under Sparse Crowdsourcing"
shortTitle: BRAVE
status: under-review
period: "2026"
summary: Reliable label aggregation under sparse crowdsourcing by separating block-local and global posterior structure and controlling recursive evidence feedback.
role: Zerun Niu — first author; led algorithm design, literature review, experimental design, code implementation, and experimental deployment.
tags:
  [Reliable ML, Crowdsourcing, Calibration, Bayesian inference, Sparse evidence]
metrics:
  - value: "14"
    label: crowdsourcing benchmarks
  - value: 5/14
    label: lowest NLL
  - value: 9/14
    label: best or tied-best ECE
  - value: 11/14
    label: within 0.03 accuracy of the strongest baseline
links:
  - label: OpenReview
    url: https://openreview.net/forum?id=iWFI5hO1dZ
featured: true
workstation: evidence
accent: orange
agentSummary: I designed BRAVE's controlled evidence feedback algorithm and led the literature review, experimental design, implementation, and experimental pipeline. The work is under review at TMLR.
order: 3
---

## The reliability failure

Sparse crowdsourcing creates a subtle failure mode: once an aggregated label posterior is fed back as evidence, an early mistake can reinforce itself. The model may appear increasingly confident even though no genuinely new annotation evidence has arrived. We call this **illusory evidence accumulation**.

## What I designed

BRAVE separates the posterior used inside each evidence block from the global posterior carried across blocks. A controlled feedback coefficient regulates how much global belief can influence the next local update. This preserves useful information transfer without letting recursive pseudo-evidence dominate the observed labels.

## My contribution

As first author, I led the algorithm design, literature review, experimental design, code implementation, experimental deployment, and analysis. I built the study around both predictive performance and uncertainty quality, because reliable aggregation requires more than accuracy alone.

## Evidence

Across 14 crowdsourcing benchmarks, BRAVE achieved the lowest negative log-likelihood on 5 datasets and the best or tied-best expected calibration error on 9. Its accuracy was within 0.03 of the strongest external baseline on 11 datasets. We also completed a downstream reward-model calibration transfer experiment.

> Status: under review at TMLR. This page describes first-author work but does not imply acceptance. The linked public page omits Author Console parameters and this site does not host the submitted manuscript.
