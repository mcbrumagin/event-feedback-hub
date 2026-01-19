import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { fetchEvents, createEvent } from '@/lib/graphql';
import { toEventViewModels, type EventViewModel } from '@/viewModels/event';
import { log } from '@/lib/logger';
import { Lock, Plus, Calendar, LogOut } from 'lucide-react';

export function AdminPage() {
  const { isAuthenticated, token, login, logout, isLoading: authLoading, error: authError } = useAuth();
  
  // Login form state
  const [password, setPassword] = useState('');
  
  // Event creation state
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Load events when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated]);

  async function loadEvents() {
    try {
      const data = await fetchEvents();
      setEvents(toEventViewModels(data));
    } catch (err) {
      log.error('Failed to load events', { error: err });
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await login(password);
    setPassword('');
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !eventName.trim() || !eventDateTime) return;

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      const dateTime = new Date(eventDateTime).toISOString();
      await createEvent(eventName.trim(), dateTime, token);
      setEventName('');
      setEventDateTime('');
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
      await loadEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setCreateError(message);
      log.error('Failed to create event', { error: err });
    } finally {
      setIsCreating(false);
    }
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Decorative background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your password to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>

              {authError && (
                <p className="text-sm text-destructive">{authError}</p>
              )}

              <Button
                type="submit"
                disabled={authLoading || !password}
                className="w-full"
              >
                {authLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background p-4">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage events and monitor feedback
            </p>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create event form */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Event
              </CardTitle>
              <CardDescription>
                Add a new event (can be scheduled for the past or future)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    placeholder="e.g., Tech Conference 2024"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDateTime">Date & Time</Label>
                  <Input
                    id="eventDateTime"
                    type="datetime-local"
                    value={eventDateTime}
                    onChange={(e) => setEventDateTime(e.target.value)}
                  />
                </div>

                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                
                {createSuccess && (
                  <p className="text-sm text-primary">Event created successfully!</p>
                )}

                <Button
                  type="submit"
                  disabled={isCreating || !eventName.trim() || !eventDateTime}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Create Event'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Events list */}
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events
              </CardTitle>
              <CardDescription>
                {events.length} event{events.length !== 1 ? 's' : ''} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No events yet. Create one to get started!
                  </p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.formattedDateTime}
                          </p>
                        </div>
                        {event.isPast ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            Past
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
