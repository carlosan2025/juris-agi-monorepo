'use client';

/**
 * Governance Module Editor Component
 *
 * Provides a comprehensive interface for editing governance configuration:
 * - Roles
 * - Committees (with quorum settings)
 * - Approval Tiers (with condition builder)
 * - Exception Policy
 * - Conflicts Policy
 * - Audit Settings
 *
 * Supports template selection and validation feedback.
 */

import { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Users,
  Shield,
  FileText,
  AlertTriangle,
  Scale,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import type {
  GovernanceThresholdsModulePayload,
  GovernanceRole,
  GovernanceCommittee,
  GovernanceApprovalTier,
  GovernanceCondition,
  GovernanceOperator,
  RequiredCommitteeApproval,
  RequiredSignoff,
  ExceptionSeverityClass,
  GovernanceExceptionPolicy,
  GovernanceConflictsPolicy,
  GovernanceAuditPolicy,
} from '@/lib/baseline/types';
import type { GovernanceTemplate } from '@/lib/baseline/governance-templates';
import {
  GOVERNANCE_OPERATOR_INFO,
  GOVERNANCE_CONDITION_FIELDS,
  STANDARD_GOVERNANCE_ROLES,
  getGovernanceTemplatesForIndustry,
  createGovernanceFromTemplate,
} from '@/lib/baseline/governance-templates';

// =============================================================================
// TYPES
// =============================================================================

interface GovernanceEditorProps {
  payload: GovernanceThresholdsModulePayload;
  onChange: (payload: GovernanceThresholdsModulePayload) => void;
  canEdit: boolean;
  industry?: string;
  templates?: GovernanceTemplate[];
  onApplyTemplate?: (template: GovernanceTemplate) => void;
}

interface SectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function CollapsibleSection({ title, description, defaultOpen = true, children }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
          <div>
            <h3 className="font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// ROLES EDITOR
// =============================================================================

function RolesEditor({
  roles,
  onChange,
  canEdit,
}: {
  roles: GovernanceRole[];
  onChange: (roles: GovernanceRole[]) => void;
  canEdit: boolean;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const handleAddRole = () => {
    if (!newRoleId || !newRoleName) return;

    const id = newRoleId.toUpperCase().replace(/\s+/g, '_');
    if (roles.some((r) => r.id === id)) return;

    onChange([
      ...roles,
      {
        id,
        name: newRoleName,
        description: newRoleDescription || undefined,
      },
    ]);

    setNewRoleId('');
    setNewRoleName('');
    setNewRoleDescription('');
    setShowAddDialog(false);
  };

  const handleAddStandardRole = (roleKey: string) => {
    const standardRole = STANDARD_GOVERNANCE_ROLES[roleKey];
    if (!standardRole || roles.some((r) => r.id === standardRole.id)) return;
    onChange([...roles, { ...standardRole }]);
  };

  const handleRemoveRole = (index: number) => {
    onChange(roles.filter((_, i) => i !== index));
  };

  const availableStandardRoles = Object.entries(STANDARD_GOVERNANCE_ROLES).filter(
    ([_, role]) => !roles.some((r) => r.id === role.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Governance Roles ({roles.length})</Label>
        {canEdit && (
          <div className="flex gap-2">
            {availableStandardRoles.length > 0 && (
              <Select onValueChange={handleAddStandardRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Add standard role" />
                </SelectTrigger>
                <SelectContent>
                  {availableStandardRoles.map(([key, role]) => (
                    <SelectItem key={key} value={key}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Custom Role
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        {roles.map((role, index) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-card"
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{role.name}</div>
                <div className="text-xs text-muted-foreground">{role.id}</div>
                {role.description && (
                  <div className="text-sm text-muted-foreground">{role.description}</div>
                )}
              </div>
            </div>
            {canEdit && (
              <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {roles.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No roles defined. Add roles to configure governance.
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Role</DialogTitle>
            <DialogDescription>
              Create a custom governance role with a unique ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role ID (uppercase, underscores)</Label>
              <Input
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                placeholder="e.g., BOARD_MEMBER"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Board Member"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Brief description of the role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={!newRoleId || !newRoleName}>
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =============================================================================
// COMMITTEES EDITOR
// =============================================================================

function CommitteesEditor({
  committees,
  roles,
  onChange,
  canEdit,
}: {
  committees: GovernanceCommittee[];
  roles: GovernanceRole[];
  onChange: (committees: GovernanceCommittee[]) => void;
  canEdit: boolean;
}) {
  const handleAddCommittee = () => {
    onChange([
      ...committees,
      {
        id: generateId('committee'),
        name: 'New Committee',
        roleIds: [],
        quorum: {
          minVotes: 3,
          minYesVotes: 2,
          voteType: 'MAJORITY',
        },
      },
    ]);
  };

  const handleUpdateCommittee = (index: number, updates: Partial<GovernanceCommittee>) => {
    const updated = [...committees];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemoveCommittee = (index: number) => {
    onChange(committees.filter((_, i) => i !== index));
  };

  const handleToggleRole = (committeeIndex: number, roleId: string) => {
    const committee = committees[committeeIndex];
    const roleIds = committee.roleIds.includes(roleId)
      ? committee.roleIds.filter((id) => id !== roleId)
      : [...committee.roleIds, roleId];
    handleUpdateCommittee(committeeIndex, { roleIds });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Committees ({committees.length})</Label>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={handleAddCommittee}>
            <Plus className="h-4 w-4 mr-1" />
            Add Committee
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {committees.map((committee, index) => (
          <Card key={committee.id}>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={committee.name}
                  onChange={(e) => handleUpdateCommittee(index, { name: e.target.value })}
                  disabled={!canEdit}
                  className="max-w-sm font-medium"
                />
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCommittee(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Committee Members</Label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge
                      key={role.id}
                      variant={committee.roleIds.includes(role.id) ? 'default' : 'outline'}
                      className={`cursor-pointer ${canEdit ? 'hover:bg-primary/80' : ''}`}
                      onClick={() => canEdit && handleToggleRole(index, role.id)}
                    >
                      {role.name}
                    </Badge>
                  ))}
                </div>
                {committee.roleIds.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Click roles above to add them to this committee.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Votes</Label>
                  <Input
                    type="number"
                    min={1}
                    value={committee.quorum.minVotes}
                    onChange={(e) =>
                      handleUpdateCommittee(index, {
                        quorum: { ...committee.quorum, minVotes: parseInt(e.target.value) || 1 },
                      })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Yes Votes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={committee.quorum.minVotes}
                    value={committee.quorum.minYesVotes}
                    onChange={(e) =>
                      handleUpdateCommittee(index, {
                        quorum: { ...committee.quorum, minYesVotes: parseInt(e.target.value) || 1 },
                      })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vote Type</Label>
                  <Select
                    value={committee.quorum.voteType}
                    onValueChange={(v) =>
                      handleUpdateCommittee(index, {
                        quorum: {
                          ...committee.quorum,
                          voteType: v as 'UNANIMOUS' | 'MAJORITY' | 'SUPERMAJORITY' | 'SIMPLE',
                        },
                      })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNANIMOUS">Unanimous</SelectItem>
                      <SelectItem value="MAJORITY">Majority</SelectItem>
                      <SelectItem value="SUPERMAJORITY">Supermajority</SelectItem>
                      <SelectItem value="SIMPLE">Simple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {committees.length === 0 && (
          <div className="text-center py-6 text-muted-foreground border rounded-lg">
            No committees defined. Add at least one committee for governance.
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CONDITION BUILDER
// =============================================================================

function ConditionBuilder({
  conditions,
  onChange,
  canEdit,
  industry = 'GENERIC',
}: {
  conditions: GovernanceCondition[];
  onChange: (conditions: GovernanceCondition[]) => void;
  canEdit: boolean;
  industry?: string;
}) {
  const fields = GOVERNANCE_CONDITION_FIELDS[industry] || GOVERNANCE_CONDITION_FIELDS.GENERIC;
  const operators = Object.entries(GOVERNANCE_OPERATOR_INFO);

  const handleAddCondition = () => {
    onChange([
      ...conditions,
      {
        field: fields[0]?.field || 'case.value',
        operator: 'EQUALS',
        value: 0,
      },
    ]);
  };

  const handleUpdateCondition = (index: number, updates: Partial<GovernanceCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <Select
              value={condition.logic || 'AND'}
              onValueChange={(v) => handleUpdateCondition(index, { logic: v as 'AND' | 'OR' })}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select
            value={condition.field}
            onValueChange={(v) => handleUpdateCondition(index, { field: v })}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map((f) => (
                <SelectItem key={f.field} value={f.field}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={condition.operator}
            onValueChange={(v) => handleUpdateCondition(index, { operator: v as GovernanceOperator })}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map(([op, info]) => (
                <SelectItem key={op} value={op}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={String(condition.value)}
            onChange={(e) => {
              const val = e.target.value;
              // Try to parse as number if it looks numeric
              const numVal = parseFloat(val);
              handleUpdateCondition(index, {
                value: !isNaN(numVal) ? numVal : val === 'true' ? true : val === 'false' ? false : val,
              });
            }}
            disabled={!canEdit}
            className="w-[120px]"
          />
          {canEdit && (
            <Button variant="ghost" size="icon" onClick={() => handleRemoveCondition(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      {canEdit && (
        <Button variant="outline" size="sm" onClick={handleAddCondition}>
          <Plus className="h-4 w-4 mr-1" />
          Add Condition
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// APPROVAL TIERS EDITOR
// =============================================================================

function ApprovalTiersEditor({
  tiers,
  committees,
  roles,
  onChange,
  canEdit,
  industry,
}: {
  tiers: GovernanceApprovalTier[];
  committees: GovernanceCommittee[];
  roles: GovernanceRole[];
  onChange: (tiers: GovernanceApprovalTier[]) => void;
  canEdit: boolean;
  industry?: string;
}) {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const handleAddTier = () => {
    const newTier: GovernanceApprovalTier = {
      id: generateId('tier'),
      name: 'New Approval Tier',
      conditions: [],
      requiredApprovals: [],
      requiredSignoffs: [],
    };
    onChange([...tiers, newTier]);
    setExpandedTier(newTier.id);
  };

  const handleUpdateTier = (index: number, updates: Partial<GovernanceApprovalTier>) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleRemoveTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Approval Tiers ({tiers.length})</Label>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={handleAddTier}>
            <Plus className="h-4 w-4 mr-1" />
            Add Tier
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <Card key={tier.id} className={expandedTier === tier.id ? 'ring-2 ring-primary' : ''}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedTier === tier.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <CardTitle className="text-base">{tier.name}</CardTitle>
                  <Badge variant="outline">{tier.conditions.length} conditions</Badge>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTier(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            {expandedTier === tier.id && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tier Name</Label>
                  <Input
                    value={tier.name}
                    onChange={(e) => handleUpdateTier(index, { name: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={tier.description || ''}
                    onChange={(e) => handleUpdateTier(index, { description: e.target.value })}
                    disabled={!canEdit}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trigger Conditions</Label>
                  <ConditionBuilder
                    conditions={tier.conditions}
                    onChange={(conditions) => handleUpdateTier(index, { conditions })}
                    canEdit={canEdit}
                    industry={industry}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Required Committee Approvals</Label>
                  <div className="space-y-2">
                    {tier.requiredApprovals.map((approval, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <Select
                          value={approval.committeeId}
                          onValueChange={(v) => {
                            const updated = [...tier.requiredApprovals];
                            updated[ai] = { ...approval, committeeId: v };
                            handleUpdateTier(index, { requiredApprovals: updated });
                          }}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select committee" />
                          </SelectTrigger>
                          <SelectContent>
                            {committees.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          value={approval.minYesVotes}
                          onChange={(e) => {
                            const updated = [...tier.requiredApprovals];
                            updated[ai] = { ...approval, minYesVotes: parseInt(e.target.value) || 1 };
                            handleUpdateTier(index, { requiredApprovals: updated });
                          }}
                          disabled={!canEdit}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">yes votes</span>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleUpdateTier(index, {
                                requiredApprovals: tier.requiredApprovals.filter((_, i) => i !== ai),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {canEdit && committees.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleUpdateTier(index, {
                            requiredApprovals: [
                              ...tier.requiredApprovals,
                              { committeeId: committees[0].id, minYesVotes: 2 },
                            ],
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Committee
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Required Signoffs</Label>
                  <div className="space-y-2">
                    {tier.requiredSignoffs.map((signoff, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <Select
                          value={signoff.roleId}
                          onValueChange={(v) => {
                            const updated = [...tier.requiredSignoffs];
                            updated[si] = { ...signoff, roleId: v };
                            handleUpdateTier(index, { requiredSignoffs: updated });
                          }}
                          disabled={!canEdit}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={signoff.required}
                            onCheckedChange={(checked) => {
                              const updated = [...tier.requiredSignoffs];
                              updated[si] = { ...signoff, required: checked };
                              handleUpdateTier(index, { requiredSignoffs: updated });
                            }}
                            disabled={!canEdit}
                          />
                          <span className="text-sm">{signoff.required ? 'Required' : 'Optional'}</span>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleUpdateTier(index, {
                                requiredSignoffs: tier.requiredSignoffs.filter((_, i) => i !== si),
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {canEdit && roles.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleUpdateTier(index, {
                            requiredSignoffs: [
                              ...tier.requiredSignoffs,
                              { roleId: roles[0].id, required: false },
                            ],
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Signoff
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        {tiers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground border rounded-lg">
            No approval tiers defined. Add at least one tier to configure approvals.
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXCEPTION POLICY EDITOR
// =============================================================================

function ExceptionPolicyEditor({
  policy,
  committees,
  roles,
  onChange,
  canEdit,
  industry,
}: {
  policy: GovernanceExceptionPolicy;
  committees: GovernanceCommittee[];
  roles: GovernanceRole[];
  onChange: (policy: GovernanceExceptionPolicy) => void;
  canEdit: boolean;
  industry?: string;
}) {
  const handleAddSeverity = () => {
    onChange({
      ...policy,
      exceptionSeverity: [
        ...policy.exceptionSeverity,
        {
          id: generateId('severity'),
          name: 'New Severity Class',
          conditions: [],
          requiredApprovals: [],
          requiredSignoffs: [],
        },
      ],
    });
  };

  const handleUpdateSeverity = (index: number, updates: Partial<ExceptionSeverityClass>) => {
    const updated = [...policy.exceptionSeverity];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...policy, exceptionSeverity: updated });
  };

  const handleRemoveSeverity = (index: number) => {
    onChange({
      ...policy,
      exceptionSeverity: policy.exceptionSeverity.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <Switch
          checked={policy.requiresExceptionRecord}
          onCheckedChange={(checked) => onChange({ ...policy, requiresExceptionRecord: checked })}
          disabled={!canEdit}
        />
        <div>
          <Label>Require Exception Records</Label>
          <p className="text-sm text-muted-foreground">
            When enabled, exceptions must be formally recorded before proceeding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Default Expiry (days)</Label>
          <Input
            type="number"
            min={1}
            value={policy.expiryDefaultDays}
            onChange={(e) =>
              onChange({ ...policy, expiryDefaultDays: parseInt(e.target.value) || 365 })
            }
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Extensions</Label>
          <Input
            type="number"
            min={0}
            value={policy.maxExtensions || 0}
            onChange={(e) =>
              onChange({ ...policy, maxExtensions: parseInt(e.target.value) || 0 })
            }
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exception Severity Classes</Label>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleAddSeverity}>
              <Plus className="h-4 w-4 mr-1" />
              Add Severity Class
            </Button>
          )}
        </div>

        {policy.exceptionSeverity.map((severity, index) => (
          <Card key={severity.id}>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Input
                  value={severity.name}
                  onChange={(e) => handleUpdateSeverity(index, { name: e.target.value })}
                  disabled={!canEdit}
                  className="max-w-xs font-medium"
                />
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveSeverity(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Trigger Conditions</Label>
                <ConditionBuilder
                  conditions={severity.conditions}
                  onChange={(conditions) => handleUpdateSeverity(index, { conditions })}
                  canEdit={canEdit}
                  industry={industry}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Approvals</Label>
                  {severity.requiredApprovals.map((approval, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <Select
                        value={approval.committeeId}
                        onValueChange={(v) => {
                          const updated = [...severity.requiredApprovals];
                          updated[ai] = { ...approval, committeeId: v };
                          handleUpdateSeverity(index, { requiredApprovals: updated });
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {committees.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleUpdateSeverity(index, {
                          requiredApprovals: [
                            ...severity.requiredApprovals,
                            { committeeId: committees[0]?.id || '', minYesVotes: 2 },
                          ],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Required Signoffs</Label>
                  {severity.requiredSignoffs.map((signoff, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <Select
                        value={signoff.roleId}
                        onValueChange={(v) => {
                          const updated = [...severity.requiredSignoffs];
                          updated[si] = { ...signoff, roleId: v };
                          handleUpdateSeverity(index, { requiredSignoffs: updated });
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleUpdateSeverity(index, {
                          requiredSignoffs: [
                            ...severity.requiredSignoffs,
                            { roleId: roles[0]?.id || '', required: true },
                          ],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CONFLICTS POLICY EDITOR
// =============================================================================

function ConflictsPolicyEditor({
  policy,
  roles,
  onChange,
  canEdit,
}: {
  policy: GovernanceConflictsPolicy;
  roles: GovernanceRole[];
  onChange: (policy: GovernanceConflictsPolicy) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Switch
          checked={policy.requiresDisclosure}
          onCheckedChange={(checked) => onChange({ ...policy, requiresDisclosure: checked })}
          disabled={!canEdit}
        />
        <Label>Require Conflict Disclosure</Label>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={policy.recusalRequired}
          onCheckedChange={(checked) => onChange({ ...policy, recusalRequired: checked })}
          disabled={!canEdit}
        />
        <Label>Require Recusal for Conflicts</Label>
      </div>

      <div className="space-y-2">
        <Label>Disclosure Scope</Label>
        <Select
          value={policy.disclosureScope || 'MATERIAL'}
          onValueChange={(v) =>
            onChange({ ...policy, disclosureScope: v as 'ALL' | 'MATERIAL' | 'FINANCIAL' })
          }
          disabled={!canEdit}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Conflicts</SelectItem>
            <SelectItem value="MATERIAL">Material Only</SelectItem>
            <SelectItem value="FINANCIAL">Financial Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Blocked Roles (cannot participate in approvals)</Label>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Badge
              key={role.id}
              variant={policy.blockedRoles.includes(role.id) ? 'destructive' : 'outline'}
              className={`cursor-pointer ${canEdit ? 'hover:bg-destructive/80' : ''}`}
              onClick={() => {
                if (!canEdit) return;
                const blockedRoles = policy.blockedRoles.includes(role.id)
                  ? policy.blockedRoles.filter((id) => id !== role.id)
                  : [...policy.blockedRoles, role.id];
                onChange({ ...policy, blockedRoles });
              }}
            >
              {role.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUDIT POLICY EDITOR
// =============================================================================

function AuditPolicyEditor({
  policy,
  onChange,
  canEdit,
}: {
  policy: GovernanceAuditPolicy;
  onChange: (policy: GovernanceAuditPolicy) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Switch
          checked={policy.decisionRecordRequired}
          onCheckedChange={(checked) => onChange({ ...policy, decisionRecordRequired: checked })}
          disabled={!canEdit}
        />
        <Label>Require Decision Records</Label>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={policy.retainVersions}
          onCheckedChange={(checked) => onChange({ ...policy, retainVersions: checked })}
          disabled={!canEdit}
        />
        <Label>Retain Version History</Label>
      </div>

      <div className="space-y-2">
        <Label>Signoff Capture Method</Label>
        <Select
          value={policy.signoffCapture}
          onValueChange={(v) =>
            onChange({ ...policy, signoffCapture: v as 'ELECTRONIC' | 'MANUAL' | 'BOTH' })
          }
          disabled={!canEdit}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ELECTRONIC">Electronic Only</SelectItem>
            <SelectItem value="MANUAL">Manual Only</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Retention Period (years)</Label>
        <Input
          type="number"
          min={1}
          value={policy.retentionYears || 7}
          onChange={(e) =>
            onChange({ ...policy, retentionYears: parseInt(e.target.value) || 7 })
          }
          disabled={!canEdit}
          className="w-[120px]"
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN GOVERNANCE EDITOR COMPONENT
// =============================================================================

export function GovernanceEditor({
  payload,
  onChange,
  canEdit,
  industry = 'GENERIC',
  templates: externalTemplates,
  onApplyTemplate,
}: GovernanceEditorProps) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GovernanceTemplate | null>(null);

  // Use external templates if provided, otherwise fetch based on industry
  const templates = externalTemplates ?? getGovernanceTemplatesForIndustry(industry);

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      // If custom handler provided, use it; otherwise apply directly
      if (onApplyTemplate) {
        onApplyTemplate(selectedTemplate);
      } else {
        // Apply template directly to payload
        const newPayload = createGovernanceFromTemplate(selectedTemplate);
        onChange(newPayload);
      }
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {canEdit && templates.length > 0 && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Use a Template</p>
              <p className="text-sm text-muted-foreground">
                Start with a pre-configured governance template for your industry.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            Browse Templates
          </Button>
        </div>
      )}

      {/* Roles Section */}
      <CollapsibleSection title="Roles" description="Define governance participants">
        <RolesEditor
          roles={payload.roles || []}
          onChange={(roles) => onChange({ ...payload, roles })}
          canEdit={canEdit}
        />
      </CollapsibleSection>

      {/* Committees Section */}
      <CollapsibleSection title="Committees" description="Configure voting bodies and quorum rules">
        <CommitteesEditor
          committees={payload.committees || []}
          roles={payload.roles || []}
          onChange={(committees) => onChange({ ...payload, committees })}
          canEdit={canEdit}
        />
      </CollapsibleSection>

      {/* Approval Tiers Section */}
      <CollapsibleSection title="Approval Tiers" description="Define approval requirements by conditions">
        <ApprovalTiersEditor
          tiers={payload.approvalTiers || []}
          committees={payload.committees || []}
          roles={payload.roles || []}
          onChange={(approvalTiers) => onChange({ ...payload, approvalTiers })}
          canEdit={canEdit}
          industry={industry}
        />
      </CollapsibleSection>

      {/* Exception Policy Section */}
      <CollapsibleSection title="Exception Policy" description="Configure exception handling and severity classes">
        <ExceptionPolicyEditor
          policy={
            payload.exceptionPolicy || {
              requiresExceptionRecord: true,
              exceptionSeverity: [],
              expiryDefaultDays: 365,
            }
          }
          committees={payload.committees || []}
          roles={payload.roles || []}
          onChange={(exceptionPolicy) => onChange({ ...payload, exceptionPolicy })}
          canEdit={canEdit}
          industry={industry}
        />
      </CollapsibleSection>

      {/* Conflicts Policy Section */}
      <CollapsibleSection title="Conflicts Policy" description="Define conflict of interest rules">
        <ConflictsPolicyEditor
          policy={
            payload.conflictsPolicy || {
              requiresDisclosure: true,
              recusalRequired: true,
              blockedRoles: [],
            }
          }
          roles={payload.roles || []}
          onChange={(conflictsPolicy) => onChange({ ...payload, conflictsPolicy })}
          canEdit={canEdit}
        />
      </CollapsibleSection>

      {/* Audit Policy Section */}
      <CollapsibleSection title="Audit Settings" description="Configure audit trail and retention">
        <AuditPolicyEditor
          policy={
            payload.audit || {
              decisionRecordRequired: true,
              signoffCapture: 'ELECTRONIC',
              retainVersions: true,
            }
          }
          onChange={(audit) => onChange({ ...payload, audit })}
          canEdit={canEdit}
        />
      </CollapsibleSection>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Governance Template</DialogTitle>
            <DialogDescription>
              Choose a template to pre-populate your governance configuration.
              This will replace your current settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{template.governance.roles?.length || 0} roles</span>
                    <span>{template.governance.committees?.length || 0} committees</span>
                    <span>{template.governance.approvalTiers?.length || 0} tiers</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate} disabled={!selectedTemplate}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GovernanceEditor;
