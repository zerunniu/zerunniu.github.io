---
title: Federated Deep Equilibrium Learning over Resource-Constrained Edge Networks
shortTitle: FeDEQ
status: under-review
period: "2025-present"
summary: FeDEQ trains a shared equilibrium representation across edge devices while keeping personalized layers local, targeting non-IID data and communication and memory constraints.
role: Implemented FeDEQ components, explored communication-efficient aggregation, and evaluated non-IID NLP and vision settings.
tags:
  [
    Federated learning,
    Deep equilibrium models,
    Edge AI,
    Distributed optimisation,
  ]
metrics:
  - value: NLP + vision
    label: evaluation domains
featured: true
workstation: equilibrium
accent: indigo
agentSummary: I implemented FeDEQ components and evaluated communication-efficient federated equilibrium learning across heterogeneous edge clients.
order: 3
---

## A model that solves for equilibrium

Deep equilibrium models represent an effectively infinite-depth, weight-tied network through an input-dependent fixed point. FeDEQ combines a compact shared equilibrium representation with personalized local layers for clients with non-IID data.

Its federated procedure uses ADMM consensus optimization. The server averages shared representation parameters and distributes them to selected clients. Each client keeps its personalized layers local and returns updated shared representation parameters, rather than its data or equilibrium states. Local training uses Randomized Coordinate Update Anderson Acceleration (RCAA) for the fixed-point solve and regularized phantom gradients for the backward pass, alongside local parameter and dual-variable updates.

My work covers implementation, aggregation studies, and experiments spanning NLP and vision. The engineering emphasis is reproducibility: controlled data partitions, explicit communication accounting, stable fixed-point solvers, and comparable baselines.
