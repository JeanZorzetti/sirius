"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import {
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("marketing.contact");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });

  const subjects = t.raw("subjects") as Array<{ value: string; label: string }>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("toast.errorDesc"));
      }

      setIsSubmitted(true);
      toast({
        title: t("toast.successTitle"),
        description: t("toast.successDesc"),
      });
    } catch (error: any) {
      toast({
        title: t("toast.errorTitle"),
        description: error.message || t("toast.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://siriuscrm.com.br" },
      { "@type": "ListItem", position: 2, name: "Contact", item: "https://siriuscrm.com.br/contact" },
    ],
  };

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact - Sirius CRM",
    description: "Get in touch with the Sirius CRM team",
    url: "https://siriuscrm.com.br/contact",
    mainEntity: {
      "@type": "Organization",
      name: "Sirius CRM",
      email: "contato@roilabs.com.br",
      url: "https://siriuscrm.com.br",
    },
  };

  if (isSubmitted) {
    return (
      <>
        <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <div className="bg-background min-h-[80vh] flex items-center justify-center">
          <div className="mx-auto max-w-md text-center px-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{t("success.title")}</h1>
            <p className="text-muted-foreground mb-8">{t("success.description")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/">{t("success.backHome")}</Link>
              </Button>
              <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                {t("success.newMessage")}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="contact-page-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />

      <div className="bg-background">
        {/* Hero */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t("hero.title")}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t("hero.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info + Form */}
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Info */}
              <div className="lg:col-span-1 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">{t("info.title")}</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{t("info.email.title")}</h3>
                        <p className="text-muted-foreground">contato@roilabs.com.br</p>
                        <p className="text-muted-foreground">suporte@roilabs.com.br</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{t("info.chat.title")}</h3>
                        <p className="text-muted-foreground">{t("info.chat.available")}</p>
                        <p className="text-muted-foreground">{t("info.chat.hours")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{t("info.schedule.title")}</h3>
                        <p className="text-muted-foreground">{t("info.schedule.weekdays")}</p>
                        <p className="text-muted-foreground">{t("info.schedule.saturday")}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{t("info.location.title")}</h3>
                        <p className="text-muted-foreground">{t("info.location.description")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">{t("info.responseTime.title")}</h3>
                  <p className="text-muted-foreground text-sm">{t("info.responseTime.description")}</p>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-2">
                <div className="bg-card border rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">{t("form.title")}</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("form.name.label")}</Label>
                        <Input id="name" name="name" type="text" placeholder={t("form.name.placeholder")} value={formData.name} onChange={handleChange} required disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("form.email.label")}</Label>
                        <Input id="email" name="email" type="email" placeholder={t("form.email.placeholder")} value={formData.email} onChange={handleChange} required disabled={isLoading} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("form.phone.label")}</Label>
                        <Input id="phone" name="phone" type="tel" placeholder={t("form.phone.placeholder")} value={formData.phone} onChange={handleChange} disabled={isLoading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">{t("form.company.label")}</Label>
                        <Input id="company" name="company" type="text" placeholder={t("form.company.placeholder")} value={formData.company} onChange={handleChange} disabled={isLoading} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t("form.subject.label")}</Label>
                      <Select value={formData.subject} onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))} required disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("form.subject.placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t("form.message.label")}</Label>
                      <Textarea id="message" name="message" placeholder={t("form.message.placeholder")} rows={6} value={formData.message} onChange={handleChange} required disabled={isLoading} />
                    </div>

                    <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("form.sending")}</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" />{t("form.submit")}</>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("faq.title")}</h2>
              <p className="mt-4 text-muted-foreground">{t("faq.subtitle")}</p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">{t("faq.q1")}</h3>
                <p className="text-muted-foreground">{t("faq.a1")}</p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">{t("faq.q2")}</h3>
                <p className="text-muted-foreground">
                  {t("faq.a2")}{" "}
                  <Link href="/register" className="text-primary hover:underline">{t("faq.a2Link")}</Link>
                </p>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">{t("faq.q3")}</h3>
                <p className="text-muted-foreground">{t("faq.a3")}</p>
              </div>
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/help">{t("faq.helpCenter")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
