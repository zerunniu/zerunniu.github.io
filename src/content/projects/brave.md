---
title: "BRAVE: Block-wise Structural Regularization via Controlled Evidence Feedback for Reliable Label Aggregation under Sparse Crowdsourcing"
shortTitle: BRAVE
status: accepted
period: "2026"
summary: With only a few annotations, a model can become more confident without gaining new evidence. BRAVE controls how earlier estimates feed into later updates to reduce this effect.
role: Zerun Niu — first author; led algorithm design, literature review, experimental design, code implementation, and experimental deployment.
cardHighlight: Reliable label aggregation
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
agentSummary: I designed BRAVE's controlled evidence feedback algorithm and led the literature review, experimental design, implementation, and experimental pipeline. The paper was accepted at TMLR in 2026.
order: 1
---

## The reliability failure

Sparse crowdsourcing creates a subtle failure mode: workers can share the same error pattern, so their agreement does not always provide independent evidence. Globally coupled inference can repeatedly reuse that correlated agreement, making a label posterior more confident than the annotations justify. We call this **illusory evidence accumulation**.

## What I designed

BRAVE partitions workers into disjoint blocks and separates the posterior used inside each evidence block from the synchronized global posterior for each item. It controls evidence feedback through dual decoupled parameter updates: worker mixture weights use the global posterior, while shared reliability matrices use block-local posterior statistics. The class prior is anchored in observed annotation frequencies. This keeps sharpened cross-block consensus from being recycled into the shared reliability components.

## My contribution

As first author, I led the algorithm design, literature review, experimental design, code implementation, experimental deployment, and analysis. I built the study around both predictive performance and uncertainty quality, because reliable aggregation requires more than accuracy alone.

## Evidence

Across 14 crowdsourcing benchmarks, BRAVE achieved the lowest negative log-likelihood on 5 datasets and the best or tied-best expected calibration error on 9. Its accuracy was within 0.03 of the strongest external baseline on 11 datasets. We also completed a downstream reward-model calibration transfer experiment.

> Status: accepted at TMLR (2026). Zerun Niu is first author. See the public OpenReview record linked above.
