---
title: Federated Deep Equilibrium Learning over Resource-Constrained Edge Networks
shortTitle: FeDEQ
status: under-review
period: "2025-present"
summary: FeDEQ explores how devices can train a model together when they have different data, memory, energy, and communication limits, using deep equilibrium models.
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
order: 2
---

## A model that solves for equilibrium

Deep equilibrium models represent an effectively infinite-depth network through a fixed point. FeDEQ asks how that formulation can be trained across clients with non-IID data and unequal resource budgets.

My work covers implementation, aggregation studies, and experiments spanning NLP and vision. The engineering emphasis is reproducibility: controlled data partitions, explicit communication accounting, stable fixed-point solvers, and comparable baselines.
