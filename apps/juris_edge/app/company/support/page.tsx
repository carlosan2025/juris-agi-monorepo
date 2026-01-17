'use client';

import { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Book,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigation } from '@/contexts/NavigationContext';

const HELP_ARTICLES = [
  {
    id: '1',
    title: 'Getting Started with Juris',
    description: 'Learn the basics of setting up your company and portfolios',
    category: 'Getting Started',
  },
  {
    id: '2',
    title: 'Managing Users and Permissions',
    description: 'How to invite users and configure maker/checker access',
    category: 'Users',
  },
  {
    id: '3',
    title: 'Configuring Integrations',
    description: 'Connect third-party services like OpenAI and SendGrid',
    category: 'Settings',
  },
  {
    id: '4',
    title: 'Understanding Mandates',
    description: 'Create and configure investment mandates for your portfolios',
    category: 'Mandates',
  },
  {
    id: '5',
    title: 'Evidence Analysis Workflow',
    description: 'How AI analyzes documents and extracts claims',
    category: 'Analysis',
  },
];

const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    subject: 'Integration issue with OpenAI',
    status: 'open',
    createdAt: new Date('2024-03-10'),
    lastUpdate: new Date('2024-03-11'),
  },
  {
    id: 'TKT-002',
    subject: 'Question about portfolio constraints',
    status: 'resolved',
    createdAt: new Date('2024-03-05'),
    lastUpdate: new Date('2024-03-06'),
  },
];

export default function SupportPage() {
  const { company, currentUser } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredArticles = HELP_ARTICLES.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = async () => {
    setIsSubmitting(true);
    // backend_pending: Submit support ticket
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setShowNewTicket(false);
    setTicketForm({ subject: '', category: '', description: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Support</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Get help and find answers to your questions
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Book className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Documentation</div>
                <div className="text-xs text-muted-foreground">Browse guides and tutorials</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setShowNewTicket(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Contact Support</div>
                <div className="text-xs text-muted-foreground">Create a support ticket</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Schedule a Call</div>
                <div className="text-xs text-muted-foreground">Talk to our team</div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Help Articles
          </CardTitle>
          <CardDescription>Find answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Articles List */}
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{article.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {article.description}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                </div>
              </div>
            ))}
            {filteredArticles.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No articles found matching your search
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Your Support Tickets
              </CardTitle>
              <CardDescription>Track your support requests</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewTicket(true)}>
              New Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {MOCK_TICKETS.length > 0 ? (
            <div className="space-y-2">
              {MOCK_TICKETS.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ticket.id}
                        </span>
                        <span className="font-medium text-sm">{ticket.subject}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Created {ticket.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        ticket.status === 'open'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-green-500 text-green-600'
                      }
                    >
                      {ticket.status === 'open' ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No support tickets yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Email Support</div>
                <div className="text-xs text-muted-foreground">support@juris.ai</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Phone Support</div>
                <div className="text-xs text-muted-foreground">+1 (555) 123-4567</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={ticketForm.category}
                  onValueChange={(value) =>
                    setTicketForm({ ...ticketForm, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about your issue..."
                  rows={5}
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowNewTicket(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitTicket}
                  disabled={!ticketForm.subject || !ticketForm.category || isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
